import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and, sql, count, desc } from "drizzle-orm";
import type { HonoConfig } from "../../index";
import * as schema from "../../shared/database/schemas";
import { generateResidencyLetterPdf } from "../requests/requests.pdf";

const kioskoRouter = new Hono<HonoConfig>();

/* ─────────── SEARCH ─────────── */

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

    if (family) conditions.push(sql`LOWER(${schema.families.name}) LIKE ${`%${family.toLowerCase()}%`}`);
    if (address) conditions.push(sql`LOWER(${schema.houses.address}) LIKE ${`%${address.toLowerCase()}%`}`);
    if (sector) conditions.push(sql`LOWER(${schema.houses.sector}) = ${sector.toLowerCase()}`);
    if (dni) {
      const cleanDni = dni.replace(/^[VEve]-?/, "").trim();
      conditions.push(sql`LOWER(${schema.citizens.dni}) LIKE ${`%${cleanDni}%`}`);
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

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

    const [totalResult] = await db
      .select({ total: count() })
      .from(schema.citizens)
      .leftJoin(schema.families, eq(schema.citizens.familyId, schema.families.id))
      .leftJoin(schema.houses, eq(schema.families.houseId, schema.houses.id))
      .where(where);

    return c.json({ data: rows, metadata: { total: totalResult?.total ?? 0, page, limit, totalPages: Math.ceil((totalResult?.total ?? 0) / limit) } });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

/* ─────────── PDF ─────────── */

kioskoRouter.post("/pdf", zValidator("json", z.object({ citizenId: z.string() })), async (c) => {
  try {
    const db = c.get("db");

    // 1. Obtener datos del ciudadano con familia y vivienda
    const citizen = await db
      .select({
        id: schema.citizens.id,
        dni: schema.citizens.dni,
        firstName: schema.citizens.firstName,
        lastName: schema.citizens.lastName,
        phone: schema.citizens.phone,
        familyName: schema.families.name,
        houseAddress: schema.houses.address,
        houseSector: schema.houses.sector,
        houseNumber: schema.houses.number,
        createdAt: schema.citizens.createdAt,
      })
      .from(schema.citizens)
      .leftJoin(schema.families, eq(schema.citizens.familyId, schema.families.id))
      .leftJoin(schema.houses, eq(schema.families.houseId, schema.houses.id))
      .where(eq(schema.citizens.id, c.req.valid("json").citizenId))
      .get();

    if (!citizen) return c.json({ error: "Ciudadano no encontrado" }, 404);

    // 2. Obtener firmantes del consejo comunal
    const signatories = await db
      .select()
      .from(schema.councilSignatories)
      .all();

    // 3. Calcular años de residencia aproximados
    const yearsSinceCreation = citizen.createdAt
      ? Math.floor((Date.now() - new Date(citizen.createdAt).getTime()) / 31557600000)
      : 1;
    const yearsOfResidence = Math.max(1, yearsSinceCreation);

    // 4. Construir payload para el generador de PDF
    const payload = {
      fullName: `${citizen.firstName} ${citizen.lastName}`,
      idNumber: citizen.dni,
      nationality: "Venezolano(a)",
      yearsOfResidence,
      streetName: citizen.houseAddress || `Manzana ${citizen.houseSector || ""}`,
      houseNumber: citizen.houseNumber || "S/N",
      issueDay: new Date().getDate(),
      issueMonth: new Date().toLocaleString("es-VE", { month: "long" }),
    };

    // 5. Generar PDF con el generador existente (con membrete, firmas, QR)
    const requestId = crypto.randomUUID();
    const pdfBytes = await generateResidencyLetterPdf(payload, signatories, requestId);

    // 6. Devolver PDF como descarga directa
    return new Response(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="carta-residencia-${citizen.dni.replace(/[^a-zA-Z0-9]/g, "")}.pdf"`,
      },
    });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

export default kioskoRouter;
