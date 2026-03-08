import { AIChatAgent, type OnChatMessageOptions } from "@cloudflare/ai-chat";
import { createWorkersAI } from "workers-ai-provider";
import {
  streamText,
  convertToModelMessages,
  tool,
  stepCountIs,
  type StreamTextOnFinishCallback,
  type ToolSet,
} from "ai";
import { z } from "zod";
import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import { eq, count, sql } from 'drizzle-orm';
import * as schema from "../../shared/database/schemas";

type AgentEnv = {
  sigcc_manoa_db: D1Database;
  AI: { run: (model: string, input: unknown) => Promise<unknown> };
};

const SYSTEM_PROMPT = `Eres el Asistente Virtual del Consejo Comunal de Manoa, los datos a mostrar unicamente provienen de las tools que dispones, no inventes datos. Tu función es orientar a los vecinos de la comunidad sobre trámites, reportes de servicios y convivencia.

Instrucciones de Respuesta:
- Personalidad: Eres un vecino digital: amable, respetuoso y colaborador. Usa un lenguaje claro y natural de Venezuela y en español.
- Brevedad: Ve directo al punto. Usa listas de puntos (*) para requisitos o pasos a seguir.
- Trámites y Reportes: Indica requisitos para cartas de residencia o censos. Si reportan fallas (luz, agua, gas), solicita siempre: Calle, Manzana y número de casa.
- Neutralidad: Enfócate 100% en la gestión vecinal y soluciones comunitarias, evitando debates políticos.
- Cierre: Si no tienes un dato exacto (como fechas de entrega de beneficios), sugiere estar atentos a los grupos de WhatsApp oficiales o al vocero de la calle.

Tienes acceso a herramientas que consultan la base de datos del consejo comunal de manoa. Úsalas cuando el vecino pregunte por cifras, estadísticas o datos de la comunidad. Presenta los resultados de forma clara y amigable.`;

function buildTools(db: DrizzleD1Database<typeof schema>) {
  return {
    censusSummary: tool({
      description: "Obtiene un resumen general del censo: total de viviendas, familias y habitantes registrados en la comunidad.",
      inputSchema: z.object({}),
      execute: async () => {
        const [housesCount] = await db.select({ total: count() }).from(schema.houses);
        const [familiesCount] = await db.select({ total: count() }).from(schema.families);
        const [citizensCount] = await db.select({ total: count() }).from(schema.citizens);
        return {
          viviendas: housesCount?.total ?? 0,
          familias: familiesCount?.total ?? 0,
          habitantes: citizensCount?.total ?? 0,
        };
      },
    }),

    demographicsByGender: tool({
      description: "Obtiene la distribución de habitantes por género (masculino, femenino, otro).",
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await db
          .select({ gender: schema.citizens.gender, total: count() })
          .from(schema.citizens)
          .groupBy(schema.citizens.gender);
        return rows.map(r => ({ genero: r.gender, cantidad: r.total }));
      },
    }),

    demographicsByAge: tool({
      description: "Obtiene la distribución de habitantes por grupo etario: niños (0-11), adolescentes (12-17), adultos (18-59), adultos mayores (60+).",
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await db
          .select({
            ageGroup: sql<string>`case
              when (julianday('now') - julianday(${schema.citizens.birthDate})) / 365.25 < 12 then 'Niños (0-11)'
              when (julianday('now') - julianday(${schema.citizens.birthDate})) / 365.25 < 18 then 'Adolescentes (12-17)'
              when (julianday('now') - julianday(${schema.citizens.birthDate})) / 365.25 < 60 then 'Adultos (18-59)'
              else 'Adultos mayores (60+)'
            end`,
            total: count(),
          })
          .from(schema.citizens)
          .groupBy(sql`1`);
        return rows.map(r => ({ grupo: r.ageGroup, cantidad: r.total }));
      },
    }),

    statsBySector: tool({
      description: "Obtiene estadísticas por sector de la comunidad: cantidad de viviendas en cada sector.",
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await db
          .select({
            sector: schema.houses.sector,
            viviendas: count(schema.houses.id),
          })
          .from(schema.houses)
          .groupBy(schema.houses.sector)
          .orderBy(schema.houses.sector);
        return rows;
      },
    }),

    pollsOverview: tool({
      description: "Lista las encuestas comunitarias con su estado (abierta/cerrada) y la cantidad de votos recibidos.",
      inputSchema: z.object({}),
      execute: async () => {
        const allPolls = await db
          .select({
            id: schema.polls.id,
            titulo: schema.polls.title,
            estado: schema.polls.status,
            votos: count(schema.votes.id),
          })
          .from(schema.polls)
          .leftJoin(schema.votes, eq(schema.polls.id, schema.votes.pollId))
          .groupBy(schema.polls.id)
          .orderBy(schema.polls.createdAt);
        return allPolls;
      },
    }),

    pollResults: tool({
      description: "Obtiene los resultados detallados de una encuesta específica: opciones y cantidad de votos por cada una.",
      inputSchema: z.object({
        pollId: z.string().describe("ID de la encuesta"),
      }),
      execute: async ({ pollId }) => {
        const pollInfo = await db
          .select({ titulo: schema.polls.title, estado: schema.polls.status })
          .from(schema.polls)
          .where(eq(schema.polls.id, pollId))
          .limit(1);

        if (pollInfo.length === 0) return { error: "Encuesta no encontrada" };

        const results = await db
          .select({
            opcion: schema.pollOptions.text,
            votos: count(schema.votes.id),
          })
          .from(schema.pollOptions)
          .leftJoin(schema.votes, eq(schema.pollOptions.id, schema.votes.optionId))
          .where(eq(schema.pollOptions.pollId, pollId))
          .groupBy(schema.pollOptions.id);

        return { ...pollInfo[0], opciones: results };
      },
    }),
  };
}

export class ChatAgent extends AIChatAgent<AgentEnv> {

  async onChatMessage(onFinish: StreamTextOnFinishCallback<ToolSet>, options?: OnChatMessageOptions) {
    const db = drizzle(this.env.sigcc_manoa_db, { schema });
    const workersai = createWorkersAI({ binding: this.env.AI });

    const lastUserMessage = [...this.messages].reverse().find(m => m.role === "user");
    const userText = lastUserMessage?.parts
      ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map(p => p.text)
      .join(" ") ?? "";

    const conversationId = this.name;
    const userId = options?.body?.userId as string | undefined;

    if (userId) {
      const existing = await db
        .select({ id: schema.conversations.id })
        .from(schema.conversations)
        .where(eq(schema.conversations.id, conversationId))
        .limit(1);

      if (existing.length === 0) {
        const title = userText.slice(0, 100) || "Nueva conversación";
        await db.insert(schema.conversations).values({
          id: conversationId,
          userId,
          title,
        });
      }

      if (userText) {
        await db.insert(schema.messages).values({
          conversationId,
          role: "user",
          content: userText,
        });
      }
    }

    const tools = buildTools(db);

    const result = streamText({
      model: workersai("@cf/zai-org/glm-4.7-flash"),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(this.messages),
      tools,
      stopWhen: stepCountIs(3),
      onFinish: async (event) => {
        if (userId) {
          const assistantText = event.text;
          if (assistantText) {
            await db.insert(schema.messages).values({
              conversationId,
              role: "assistant",
              content: assistantText,
            });
          }
        }
        await onFinish(event as Parameters<StreamTextOnFinishCallback<ToolSet>>[0]);
      },
    });

    return result.toUIMessageStreamResponse();
  }
}
