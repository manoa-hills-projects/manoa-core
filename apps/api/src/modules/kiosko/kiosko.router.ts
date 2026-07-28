import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and, sql, count, desc } from "drizzle-orm";
import type { HonoConfig } from "../../index";
import * as schema from "../../shared/database/schemas";

const kioskoRouter = new Hono<HonoConfig>();

const searchSchema = z.object({
  family: z.string().optional(),
  address: z.string().optional(),
  dni: z.string().optional(),
  sector: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

kioskoRouter.get("/search", zValidator("query", searchSchema), async (c) => {
  try {
    const db = c.get("db");
    const { family, address, dni, sector, page, limit } = c.req.valid("query");

    const conditions: ReturnType<typeof sql>[] = [];

    // Construir filtros dinámicamente
    if (family) {
      conditions.push(
        sql`LOWER(${schema.families.name}) LIKE ${`%${family.toLowerCase()}%`}`
      );
    }
    if (address) {
      conditions.push(
        sql`LOWER(${schema.houses.address}) LIKE ${`%${address.toLowerCase()}%`}`
      );
    }
    if (sector) {
      conditions.push(
        sql`LOWER(${schema.houses.sector}) = ${sector.toLowerCase()}`
      );
    }
    if (dni) {
      const cleanDni = dni.replace(/^[VEve]-?/, "").trim();
      conditions.push(
        sql`LOWER(${schema.citizens.dni}) LIKE ${`%${cleanDni}%`}`
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Consulta paginada con joins
    const rows = await db
      .select({
        citizenId: schema.citizens.id,
        dni: schema.citizens.dni,
        firstName: schema.citizens.firstName,
        lastName: schema.citizens.lastName,
        birthDate: schema.citizens.birthDate,
        gender: schema.citizens.gender,
        isHeadOfHousehold: schema.citizens.isHeadOfHousehold,
        phone: schema.citizens.phone,
        familyId: schema.citizens.familyId,
        familyName: schema.families.name,
        houseAddress: schema.houses.address,
        houseSector: schema.houses.sector,
        houseNumber: schema.houses.number,
      })
      .from(schema.citizens)
      .leftJoin(schema.families, eq(schema.citizens.familyId, schema.families.id))
      .leftJoin(schema.houses, eq(schema.families.houseId, schema.houses.id))
      .where(where)
      .orderBy(desc(schema.citizens.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    // Total de resultados para paginación
    const [totalResult] = await db
      .select({ total: count() })
      .from(schema.citizens)
      .leftJoin(schema.families, eq(schema.citizens.familyId, schema.families.id))
      .leftJoin(schema.houses, eq(schema.families.houseId, schema.houses.id))
      .where(where);

    const total = totalResult?.total ?? 0;

    return c.json({
      data: rows,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

export default kioskoRouter;
