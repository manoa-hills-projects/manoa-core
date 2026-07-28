import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and, sql, count, desc } from "drizzle-orm";
import type { HonoConfig } from "../../index";
import * as schema from "../../shared/database/schemas";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

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

// ─── POST /pdf — Generar PDF de carta de residencia directa ───
kioskoRouter.post("/pdf", zValidator("json", z.object({ citizenId: z.string() })), async (c) => {
  try {
    const db = c.get("db");
    const { citizenId } = c.req.valid("json");

    const citizen = await db
      .select({
        firstName: schema.citizens.firstName,
        lastName: schema.citizens.lastName,
        dni: schema.citizens.dni,
        phone: schema.citizens.phone,
        familyName: schema.families.name,
        houseAddress: schema.houses.address,
        houseSector: schema.houses.sector,
        houseNumber: schema.houses.number,
      })
      .from(schema.citizens)
      .leftJoin(schema.families, eq(schema.citizens.familyId, schema.families.id))
      .leftJoin(schema.houses, eq(schema.families.houseId, schema.houses.id))
      .where(eq(schema.citizens.id, citizenId))
      .get();

    if (!citizen) return c.json({ error: "Ciudadano no encontrado" }, 404);

    // Generar PDF simple
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const { width, height } = page.getSize();

    let y = height - 60;
    const marginX = 60;
    const lineHeight = 20;

    page.drawText("CARTA DE RESIDENCIA", { x: marginX, y, size: 22, font: boldFont });
    y -= 40;

    page.drawText("El Consejo Comunal de Manoa hace constar que:", { x: marginX, y, size: 12, font: regularFont });
    y -= 30;

    const fullName = `${citizen.firstName} ${citizen.lastName}`;
    page.drawText(fullName, { x: marginX, y, size: 16, font: boldFont });
    y -= 22;

    page.drawText(`Cédula de Identidad: ${citizen.dni}`, { x: marginX, y, size: 12, font: regularFont });
    y -= 22;

    if (citizen.phone) {
      page.drawText(`Teléfono: ${citizen.phone}`, { x: marginX, y, size: 12, font: regularFont });
      y -= 22;
    }

    if (citizen.familyName) {
      page.drawText(`Familia: ${citizen.familyName}`, { x: marginX, y, size: 12, font: regularFont });
      y -= 22;
    }

    const address = [
      citizen.houseSector ? `Manzana ${citizen.houseSector}` : "",
      citizen.houseNumber ? `Casa ${citizen.houseNumber}` : "",
      citizen.houseAddress || "",
    ].filter(Boolean).join(" · ");
    if (address) {
      page.drawText(`Dirección: ${address}`, { x: marginX, y, size: 12, font: regularFont });
      y -= 30;
    }

    y -= 20;
    page.drawText("Se expide la presente a solicitud del interesado.", { x: marginX, y, size: 11, font: regularFont });
    y -= 22;

    const today = new Date().toLocaleDateString("es-VE", { day: "numeric", month: "long", year: "numeric" });
    page.drawText(`Fecha: ${today}`, { x: marginX, y, size: 12, font: regularFont });
    y -= 50;

    page.drawText("________________________", { x: marginX, y, size: 12, font: regularFont });
    y -= 18;
    page.drawText("Vocero del Consejo Comunal", { x: marginX, y, size: 11, font: regularFont });

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="carta-residencia-${citizen.dni.replace(/[^a-zA-Z0-9]/g, "")}.pdf"`,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

export default kioskoRouter;
