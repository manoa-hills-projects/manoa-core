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
import { and, eq, count, desc, gte, lte, sql } from 'drizzle-orm';
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

    citizenByDni: tool({
      description: "Busca un ciudadano por su número de cédula o DNI.",
      inputSchema: z.object({
        dni: z.string().describe("Número de cédula o DNI del ciudadano"),
      }),
      execute: async ({ dni }) => {
        const rows = await db
          .select({
            id: schema.citizens.id,
            dni: schema.citizens.dni,
            nombres: schema.citizens.firstName,
            apellidos: schema.citizens.lastName,
            telefono: schema.citizens.phone,
            genero: schema.citizens.gender,
            esJefeFamilia: schema.citizens.isHeadOfHousehold,
          })
          .from(schema.citizens)
          .where(eq(schema.citizens.dni, dni))
          .limit(1);
        if (rows.length === 0) return { error: "Ciudadano no encontrado" };
        return rows[0];
      },
    }),

    familyDetail: tool({
      description: "Obtiene los detalles de una familia incluyendo todos sus miembros.",
      inputSchema: z.object({
        familyId: z.string().describe("ID de la familia"),
      }),
      execute: async ({ familyId }) => {
        const familyInfo = await db
          .select()
          .from(schema.families)
          .where(eq(schema.families.id, familyId))
          .limit(1);
        if (familyInfo.length === 0) return { error: "Familia no encontrada" };

        const miembros = await db
          .select({
            id: schema.citizens.id,
            nombres: schema.citizens.firstName,
            apellidos: schema.citizens.lastName,
            dni: schema.citizens.dni,
            esJefe: schema.citizens.isHeadOfHousehold,
          })
          .from(schema.citizens)
          .where(eq(schema.citizens.familyId, familyId));

        return {
          familia: {
            id: familyInfo[0].id,
            nombre: familyInfo[0].name,
            telefono: familyInfo[0].phone,
            observaciones: familyInfo[0].observations,
          },
          miembros,
        };
      },
    }),

    houseDetail: tool({
      description: "Obtiene los detalles de una vivienda incluyendo las familias y ciudadanos que la habitan.",
      inputSchema: z.object({
        houseId: z.string().describe("ID de la vivienda"),
      }),
      execute: async ({ houseId }) => {
        const houseInfo = await db
          .select()
          .from(schema.houses)
          .where(eq(schema.houses.id, houseId))
          .limit(1);
        if (houseInfo.length === 0) return { error: "Vivienda no encontrada" };

        const familiasConMiembros = await db
          .select({
            familiaId: schema.families.id,
            familiaNombre: schema.families.name,
            familiaTelefono: schema.families.phone,
            ciudadanoId: schema.citizens.id,
            ciudadanoNombres: schema.citizens.firstName,
            ciudadanoApellidos: schema.citizens.lastName,
            ciudadanoEsJefe: schema.citizens.isHeadOfHousehold,
          })
          .from(schema.families)
          .leftJoin(schema.citizens, eq(schema.citizens.familyId, schema.families.id))
          .where(eq(schema.families.houseId, houseId));

        const familiasMap = new Map<string, { id: string; nombre: string; telefono: string | null; miembros: Array<{ id: string; nombres: string; apellidos: string; esJefe: boolean | null }> }>();
        for (const row of familiasConMiembros) {
          if (!familiasMap.has(row.familiaId)) {
            familiasMap.set(row.familiaId, {
              id: row.familiaId,
              nombre: row.familiaNombre,
              telefono: row.familiaTelefono,
              miembros: [],
            });
          }
          if (row.ciudadanoId) {
            familiasMap.get(row.familiaId)!.miembros.push({
              id: row.ciudadanoId,
              nombres: row.ciudadanoNombres,
              apellidos: row.ciudadanoApellidos,
              esJefe: row.ciudadanoEsJefe,
            });
          }
        }

        return {
          vivienda: houseInfo[0],
          familias: Array.from(familiasMap.values()),
        };
      },
    }),

    sectorList: tool({
      description: "Lista todos los sectores de la comunidad con cantidad de viviendas, familias y habitantes.",
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await db
          .select({
            sector: schema.houses.sector,
            viviendas: count(schema.houses.id),
            habitantes: count(schema.citizens.id),
          })
          .from(schema.houses)
          .leftJoin(schema.families, eq(schema.families.houseId, schema.houses.id))
          .leftJoin(schema.citizens, eq(schema.citizens.familyId, schema.families.id))
          .groupBy(schema.houses.sector)
          .orderBy(schema.houses.sector);
        return rows;
      },
    }),

    citizensByAgeRange: tool({
      description: "Busca ciudadanos dentro de un rango de edad específico (en años).",
      inputSchema: z.object({
        min: z.number().describe("Edad mínima"),
        max: z.number().describe("Edad máxima"),
      }),
      execute: async ({ min, max }) => {
        const ageExpr = sql`(julianday('now') - julianday(${schema.citizens.birthDate})) / 365.25`;
        const rows = await db
          .select({
            id: schema.citizens.id,
            nombres: schema.citizens.firstName,
            apellidos: schema.citizens.lastName,
            dni: schema.citizens.dni,
            edad: sql<number>`cast(${ageExpr} as integer)`,
          })
          .from(schema.citizens)
          .where(
            and(
              gte(ageExpr, min),
              lte(ageExpr, max),
            )
          )
          .orderBy(schema.citizens.lastName);
        return rows;
      },
    }),

    upcomingEvents: tool({
      description: "Obtiene los próximos eventos y actividades programadas en la comunidad.",
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await db
          .select({
            id: schema.events.id,
            titulo: schema.events.title,
            descripcion: schema.events.description,
            fecha: schema.events.date,
            hora: schema.events.time,
            lugar: schema.events.location,
            estado: schema.events.status,
          })
          .from(schema.events)
          .where(sql`date(${schema.events.date}) >= date('now')`)
          .orderBy(schema.events.date)
          .limit(5);
        return rows;
      },
    }),

    eventsByMonth: tool({
      description: "Obtiene la cantidad de eventos agrupados por mes.",
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await db
          .select({
            mes: sql<string>`strftime('%Y-%m', ${schema.events.date})`,
            cantidad: count(schema.events.id),
          })
          .from(schema.events)
          .groupBy(sql`strftime('%Y-%m', ${schema.events.date})`)
          .orderBy(sql`strftime('%Y-%m', ${schema.events.date})`);
        return rows;
      },
    }),

    activePolls: tool({
      description: "Obtiene las encuestas comunitarias activas (abiertas para votar).",
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await db
          .select({
            id: schema.polls.id,
            titulo: schema.polls.title,
            descripcion: schema.polls.description,
            createdAt: schema.polls.createdAt,
          })
          .from(schema.polls)
          .where(eq(schema.polls.status, 'open'));
        return rows;
      },
    }),

    ticketsByStatus: tool({
      description: "Obtiene la cantidad de reportes de incidencias agrupados por estado (recibido, en_proceso, resuelto, cerrado).",
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await db
          .select({
            estado: schema.tickets.status,
            cantidad: count(schema.tickets.id),
          })
          .from(schema.tickets)
          .groupBy(schema.tickets.status);
        return rows;
      },
    }),

    ticketsRecent: tool({
      description: "Obtiene los últimos reportes de incidencias registrados en el sistema.",
      inputSchema: z.object({
        limit: z.number().optional().default(5).describe("Cantidad de reportes a obtener (por defecto 5)"),
      }),
      execute: async ({ limit }) => {
        const rows = await db
          .select({
            id: schema.tickets.id,
            titulo: schema.tickets.title,
            descripcion: schema.tickets.description,
            categoria: schema.tickets.category,
            estado: schema.tickets.status,
            createdAt: schema.tickets.createdAt,
          })
          .from(schema.tickets)
          .orderBy(desc(schema.tickets.createdAt))
          .limit(limit ?? 5);
        return rows;
      },
    }),

    ticketSearch: tool({
      description: "Busca reportes de incidencias por palabra clave en el título o la descripción.",
      inputSchema: z.object({
        query: z.string().describe("Palabra clave para buscar en los reportes"),
      }),
      execute: async ({ query }) => {
        const term = `%${query.toLowerCase()}%`;
        const rows = await db
          .select({
            id: schema.tickets.id,
            titulo: schema.tickets.title,
            descripcion: schema.tickets.description,
            categoria: schema.tickets.category,
            estado: schema.tickets.status,
            createdAt: schema.tickets.createdAt,
          })
          .from(schema.tickets)
          .where(
            sql`(LOWER(${schema.tickets.title}) LIKE ${term} OR LOWER(${schema.tickets.description}) LIKE ${term})`
          )
          .orderBy(desc(schema.tickets.createdAt))
          .limit(10);
        return rows;
      },
    }),

    actsByBookType: tool({
      description: "Obtiene las actas agrupadas por tipo de libro, con cantidad de actas y fecha de la última registrada.",
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await db
          .select({
            bookType: schema.acts.bookType,
            cantidad: count(schema.acts.id),
            ultimaFecha: sql<number>`max(${schema.acts.createdAt})`,
          })
          .from(schema.acts)
          .groupBy(schema.acts.bookType)
          .orderBy(schema.acts.bookType);
        return rows.map(r => ({
          tipo: r.bookType,
          cantidad: r.cantidad,
          ultimaActa: r.ultimaFecha ? new Date(r.ultimaFecha * 1000).toISOString() : null,
        }));
      },
    }),

    latestActs: tool({
      description: "Obtiene las últimas actas registradas en el sistema.",
      inputSchema: z.object({
        limit: z.number().optional().default(5).describe("Cantidad de actas a obtener (por defecto 5)"),
      }),
      execute: async ({ limit }) => {
        const rows = await db
          .select({
            id: schema.acts.id,
            tipoLibro: schema.acts.bookType,
            folio: schema.acts.folioNumber,
            fecha: schema.acts.fecha,
            hora: schema.acts.hora,
            lugar: schema.acts.lugar,
            tipo: schema.acts.tipo,
            contenido: schema.acts.contenido,
            publicado: schema.acts.isPublished,
            createdAt: schema.acts.createdAt,
          })
          .from(schema.acts)
          .orderBy(desc(schema.acts.createdAt))
          .limit(limit ?? 5);
        return rows;
      },
    }),

    actsSearch: tool({
      description: "Busca actas por palabra clave en su contenido.",
      inputSchema: z.object({
        query: z.string().describe("Palabra clave para buscar en el contenido de las actas"),
      }),
      execute: async ({ query }) => {
        const term = `%${query.toLowerCase()}%`;
        const rows = await db
          .select({
            id: schema.acts.id,
            tipoLibro: schema.acts.bookType,
            folio: schema.acts.folioNumber,
            fecha: schema.acts.fecha,
            contenido: schema.acts.contenido,
            createdAt: schema.acts.createdAt,
          })
          .from(schema.acts)
          .where(sql`LOWER(${schema.acts.contenido}) LIKE ${term}`)
          .orderBy(desc(schema.acts.createdAt))
          .limit(10);
        return rows;
      },
    }),

    treasurySummary: tool({
      description: "Obtiene un resumen de tesorería: total de ingresos (pagos aprobados), egresos registrados y sus montos totales.",
      inputSchema: z.object({}),
      execute: async () => {
        const [payments] = await db
          .select({
            cantidad: count(schema.treasuryPayments.id),
            montoTotalBs: sql<number>`coalesce(sum(${schema.treasuryPayments.amountBsCents}), 0)`,
          })
          .from(schema.treasuryPayments)
          .where(eq(schema.treasuryPayments.status, 'approved'));

        const [expenses] = await db
          .select({
            cantidad: count(schema.treasuryExpenses.id),
            montoTotalBs: sql<number>`coalesce(sum(${schema.treasuryExpenses.amountBsCents}), 0)`,
          })
          .from(schema.treasuryExpenses);

        return {
          ingresos: {
            cantidad: payments?.cantidad ?? 0,
            montoTotalCentimos: payments?.montoTotalBs ?? 0,
          },
          egresos: {
            cantidad: expenses?.cantidad ?? 0,
            montoTotalCentimos: expenses?.montoTotalBs ?? 0,
          },
        };
      },
    }),

    myPayments: tool({
      description: "Obtiene los pagos registrados por el vecino en tesorería.",
      inputSchema: z.object({}),
      execute: async () => {
        if (!userId) return { error: "Debes iniciar sesión para ver tus pagos" };
        const rows = await db
          .select({
            id: schema.treasuryPayments.id,
            concepto: schema.treasuryPayments.conceptId,
            descripcion: schema.treasuryPayments.description,
            montoBs: schema.treasuryPayments.amountBsCents,
            montoUsd: schema.treasuryPayments.amountUsdCents,
            estado: schema.treasuryPayments.status,
            fecha: schema.treasuryPayments.submittedAt,
          })
          .from(schema.treasuryPayments)
          .where(eq(schema.treasuryPayments.userId, userId))
          .orderBy(desc(schema.treasuryPayments.submittedAt));
        return rows;
      },
    }),

    conceptsList: tool({
      description: "Lista los conceptos de cobro activos registrados en tesorería (ej: cuotas, reparaciones).",
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await db
          .select({
            id: schema.treasuryConcepts.id,
            nombre: schema.treasuryConcepts.name,
            descripcion: schema.treasuryConcepts.description,
          })
          .from(schema.treasuryConcepts)
          .where(eq(schema.treasuryConcepts.isActive, true));
        return rows;
      },
    }),

    currentRate: tool({
      description: "Obtiene la tasa de cambio del día (BCV) registrada en el sistema de tesorería.",
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await db
          .select({
            fecha: schema.treasuryRates.date,
            tasa: schema.treasuryRates.bsPerUsd,
          })
          .from(schema.treasuryRates)
          .orderBy(desc(schema.treasuryRates.date))
          .limit(1);
        if (rows.length === 0) return { error: "No hay tasa de cambio registrada" };
        return rows[0];
      },
    }),

    lawByPdfUrl: tool({
      description: "Busca una ley popular por la URL de su PDF.",
      inputSchema: z.object({
        url: z.string().describe("URL del PDF de la ley"),
      }),
      execute: async ({ url }) => {
        const rows = await db
          .select({
            id: schema.laws.id,
            nombre: schema.laws.name,
            url: schema.laws.pdfUrl,
            contenido: schema.laws.fullText,
          })
          .from(schema.laws)
          .where(eq(schema.laws.pdfUrl, url))
          .limit(1);
        if (rows.length === 0) return { error: "Ley no encontrada" };
        return rows[0];
      },
    }),

    todayStats: tool({
      description: "Obtiene estadísticas rápidas del día: población total, viviendas, familias, leyes disponibles, encuestas activas y eventos próximos.",
      inputSchema: z.object({}),
      execute: async () => {
        const [poblacion] = await db.select({ total: count() }).from(schema.citizens);
        const [viviendas] = await db.select({ total: count() }).from(schema.houses);
        const [familias] = await db.select({ total: count() }).from(schema.families);
        const [leyes] = await db.select({ total: count() }).from(schema.laws);
        const [encuestasActivas] = await db
          .select({ total: count() })
          .from(schema.polls)
          .where(eq(schema.polls.status, 'open'));
        const [eventosProximos] = await db
          .select({ total: count() })
          .from(schema.events)
          .where(sql`date(${schema.events.date}) >= date('now')`);

        return {
          poblacionTotal: poblacion?.total ?? 0,
          viviendas: viviendas?.total ?? 0,
          familias: familias?.total ?? 0,
          leyesDisponibles: leyes?.total ?? 0,
          encuestasActivas: encuestasActivas?.total ?? 0,
          eventosProximos: eventosProximos?.total ?? 0,
        };
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
