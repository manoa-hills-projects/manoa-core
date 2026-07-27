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
  DB: D1Database;
  AI: { run: (model: string, input: unknown) => Promise<unknown> };
};

export const SYSTEM_PROMPT = `Eres el Asistente Virtual del Consejo Comunal de Manoa, los datos a mostrar unicamente provienen de las tools que dispones, no inventes datos. Tu función es orientar a los vecinos de la comunidad sobre trámites, servicios y convivencia.

PERSONALIDAD:
- Eres un vecino digital amable, respetuoso y colaborador de Venezuela.
- SIEMPRE que tengas el nombre del vecino (por tool getMyProfile), úsalo para saludar y personalizar: "Claro, Armando, veamos..."
- Habla claro, directo y con lenguaje natural venezolano.

INSTRUCCIONES:
- Sé breve. Usa listas (*) para pasos o requisitos.
- Si preguntan por trámites (carta de residencia, censo), indica los requisitos exactos.
- Para reportar fallas (luz, agua, gas), pide: calle, manzana y número de casa.
- Si tienes los datos del vecino, ofrécete a ayudarlo con acciones concretas: "¿Quieres que emita tu carta de residencia?"
- Cuando muestres datos del censo, ofrece contexto: "Hay 324 viviendas en 5 sectores. ¿Quieres ver el detalle por sector?"
- Para discapacidades o temas sensibles, sé respetuoso y discreto.
- Neutral: 100% gestión vecinal, cero política.
- Cierre: si no tienes un dato exacto, sugiere estar atentos a los WhatsApp oficiales o al vocero del sector.

HERRAMIENTAS DISPONIBLES:
- censusSummary → resumen viviendas, familias, habitantes
- demographicsByGender → hombres / mujeres
- demographicsByAge → grupos etarios
- statsBySector → viviendas por sector
- housingStats → tipos de vivienda y tenencia
- citizensBySector → cuántos habitantes por sector
- disabilitiesSummary → personas con discapacidad registradas
- pollsOverview / pollResults → encuestas comunitarias
- searchLaws → Leyes del Poder Popular. Busca en TODAS las leyes scrapeadas (Ley de Consejos Comunales, Comunas, Contraloría Social, Poder Popular, etc.). Devuelve el nombre, contenido completo y enlace al PDF.
- getMyProfile → datos del vecino autenticado (nombre, familia, vivienda)
- Esconde información personal sensible (cédula exacta, teléfono) a menos que el vecino la pida explícitamente.
- Cuando te pregunten sobre una ley específica, usa searchLaws, analiza el contenido de la ley y explícale al vecino en palabras sencillas como si fueras un amigo. Incluye detalles específicos de la ley como artículos, requisitos o procedimientos si están disponibles en el contenido de la ley.`;

export function buildTools(db: DrizzleD1Database<typeof schema>, userId?: string) {
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

    housingStats: tool({
      description: "Obtiene estadísticas de viviendas: cantidad por tipo (casa, apto, rancho) y por tenencia (propia, alquilada, cedida).",
      inputSchema: z.object({}),
      execute: async () => {
        const byType = await db
          .select({ tipo: schema.houses.type, cantidad: count(schema.houses.id) })
          .from(schema.houses)
          .groupBy(schema.houses.type);
        const byTenure = await db
          .select({ tenencia: schema.houses.tenure, cantidad: count(schema.houses.id) })
          .from(schema.houses)
          .groupBy(schema.houses.tenure);
        const labels: Record<string, string> = {
          casa: "Casa", apartamento: "Apartamento", rancho: "Rancho",
          local: "Local", propia: "Propia", alquilada: "Alquilada",
          cedida: "Cedida", otro: "Otro", otra: "Otra",
        };
        return {
          porTipo: byType.map(t => ({ tipo: labels[t.tipo ?? "otro"] ?? t.tipo, cantidad: t.cantidad })),
          porTenencia: byTenure.map(t => ({ tenencia: labels[t.tenencia ?? "otra"] ?? t.tenencia, cantidad: t.cantidad })),
        };
      },
    }),

    citizensBySector: tool({
      description: "Obtiene la cantidad de habitantes por sector de la comunidad.",
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await db
          .select({ sector: schema.houses.sector, habitantes: count(schema.citizens.id) })
          .from(schema.citizens)
          .innerJoin(schema.families, eq(schema.citizens.familyId, schema.families.id))
          .innerJoin(schema.houses, eq(schema.families.houseId, schema.houses.id))
          .groupBy(schema.houses.sector)
          .orderBy(schema.houses.sector);
        return rows;
      },
    }),

    disabilitiesSummary: tool({
      description: "Obtiene el resumen de personas con discapacidad registradas en la comunidad: total y desglose por tipo.",
      inputSchema: z.object({}),
      execute: async () => {
        const [total] = await db
          .select({ total: count(schema.citizenDisabilities.id) })
          .from(schema.citizenDisabilities);
        const byType = await db
          .select({ tipo: schema.citizenDisabilities.disabilityType, cantidad: count(schema.citizenDisabilities.id) })
          .from(schema.citizenDisabilities)
          .groupBy(schema.citizenDisabilities.disabilityType);
        const labels: Record<string, string> = {
          visual: "Visual", auditiva: "Auditiva", fisica: "Física",
          intelectual: "Intelectual", psicosocial: "Psicosocial",
          multiple: "Múltiple", otra: "Otra",
        };
        return {
          total: total?.total ?? 0,
          porTipo: byType.map(t => ({ tipo: labels[t.tipo] ?? t.tipo, cantidad: t.cantidad })),
        };
      },
    }),

    getMyProfile: tool({
      description: "Obtiene los datos del vecino que está usando el asistente (nombre, familia, vivienda, teléfono). Úsalo para personalizar la conversación y saludar por su nombre.",
      inputSchema: z.object({}),
      execute: async () => {
        if (!userId) return null;

        const citizen = await db
          .select({
            nombres: schema.citizens.firstName,
            apellidos: schema.citizens.lastName,
            telefono: schema.citizens.phone,
            familia: schema.families.name,
            sector: schema.houses.sector,
            direccion: schema.houses.address,
          })
          .from(schema.citizens)
          .leftJoin(schema.families, eq(schema.citizens.familyId, schema.families.id))
          .leftJoin(schema.houses, eq(schema.families.houseId, schema.houses.id))
          .where(eq(schema.citizens.userId, userId))
          .limit(1);

        if (citizen.length === 0) return null;
        return citizen[0];
      },
    }),

    searchLaws: tool({
      description: "Busca y analiza leyes del Poder Popular (Ley de Consejos Comunales, Comunas, Contraloría Social, Poder Popular, etc.). Devuelve el nombre, el contenido completo de la ley y enlace al PDF oficial. Úsala cuando el vecino pregunte sobre leyes, normativas, artículos, derechos, deberes o procedimientos comunales.",
      inputSchema: z.object({
        query: z.string().describe("Términos de búsqueda: nombre de la ley, artículo, tema o palabra clave"),
      }),
      execute: async ({ query }) => {
        try {
          const sanitized = query.replace(/['"*()]/g, '').trim();
          const rows = await db.all<{ name: string; pdf_url: string; full_text: string }>(
            sql`SELECT name, pdf_url, full_text FROM laws_fts WHERE laws_fts MATCH ${sanitized} ORDER BY rank LIMIT 5`
          );
          return rows.map((row: any) => ({
            ley: row.name,
            contenido: row.full_text || "Sin contenido disponible",
            enlace: row.pdf_url,
          }));
        } catch {
          const term = `%${query.toLowerCase()}%`;
          const rows = await db
            .select({ name: schema.laws.name, pdfUrl: schema.laws.pdfUrl, fullText: schema.laws.fullText })
            .from(schema.laws)
            .where(sql`LOWER(${schema.laws.fullText}) LIKE ${term} OR LOWER(${schema.laws.name}) LIKE ${term}`)
            .limit(5);
          return rows.map((row) => ({
            ley: row.name,
            contenido: row.fullText ?? "Sin contenido disponible",
            enlace: row.pdfUrl,
          }));
        }
      },
    }),
  };
}

export class ChatAgent extends AIChatAgent<AgentEnv> {

  async onChatMessage(onFinish: StreamTextOnFinishCallback<ToolSet>, options?: OnChatMessageOptions) {
    const db = drizzle(this.env.DB, { schema });
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

    const tools = buildTools(db, userId);

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
