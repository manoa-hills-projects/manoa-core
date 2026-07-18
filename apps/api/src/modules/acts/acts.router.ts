import { Hono } from "hono";
import { eq, desc, and, SQL } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { HonoConfig } from "../../index";
import { acts } from "../../shared/database/schemas/acts.schema";
import { requirePermission, requireAuth } from "../../shared/utils/permissions.middleware";
import { MODULES } from "../../shared/constants";

export const actsRouter = new Hono<HonoConfig>();

// Schema para crear/editar acta
const actSchema = z.object({
  bookType: z.string().optional(),
  folioNumber: z.number().int().positive(),
  fecha: z.string(),
  hora: z.string().optional(),
  lugar: z.string().optional(),
  tipo: z.string().optional(),
  quorum: z.number().int().optional(),
  contenido: z.string().min(1),
  vocerosPresentes: z.string().optional(),
  acuerdos: z.string().optional(),
  isPublished: z.boolean().optional(),
});

// Lista pública
actsRouter.get("/", async (c) => {
  try {
    const db = c.get("db");
    const bookType = c.req.query("bookType");
    const conditions: SQL[] = [];

    if (bookType) conditions.push(eq(acts.bookType, bookType));

    const allActs = await db
      .select()
      .from(acts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(acts.folioNumber))
      .all();

    return c.json({ data: allActs });
  } catch (error) {
    console.error("[acts] Error:", error);
    return c.json({ error: "Error al obtener actas" }, 500);
  }
});

// Detalle público
actsRouter.get("/:id", async (c) => {
  try {
    const db = c.get("db");
    const act = await db
      .select()
      .from(acts)
      .where(eq(acts.id, c.req.param("id")))
      .get();

    if (!act) return c.json({ error: "Acta no encontrada" }, 404);
    return c.json(act);
  } catch (error) {
    return c.json({ error: "Error al obtener acta" }, 500);
  }
});

// Crear (admin)
actsRouter.post("/", requirePermission(MODULES.SETTINGS), zValidator("json", actSchema), async (c) => {
  try {
    const db = c.get("db");
    const session = c.get("session");
    const data = c.req.valid("json");

    if (!session?.user?.id) return c.json({ error: "No autorizado" }, 401);

    const now = Date.now();
    const [newAct] = await db
      .insert(acts)
      .values({
        bookType: data.bookType || "asamblea_ciudadanos",
        folioNumber: data.folioNumber,
        fecha: data.fecha,
        hora: data.hora || null,
        lugar: data.lugar || null,
        tipo: data.tipo || "ordinaria",
        quorum: data.quorum || 0,
        contenido: data.contenido,
        vocerosPresentes: data.vocerosPresentes || null,
        acuerdos: data.acuerdos || null,
        isPublished: data.isPublished ?? false,
        createdBy: session.user.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return c.json(newAct, 201);
  } catch (error) {
    console.error("[acts] Create error:", error);
    return c.json({ error: "Error al crear acta" }, 500);
  }
});

// Editar (admin)
actsRouter.patch("/:id", requirePermission(MODULES.SETTINGS), zValidator("json", actSchema.partial()), async (c) => {
  try {
    const db = c.get("db");
    const data = c.req.valid("json");
    const now = Date.now();

    const [updated] = await db
      .update(acts)
      .set({ ...data, updatedAt: now })
      .where(eq(acts.id, c.req.param("id")))
      .returning();

    if (!updated) return c.json({ error: "Acta no encontrada" }, 404);
    return c.json(updated);
  } catch (error) {
    return c.json({ error: "Error al actualizar acta" }, 500);
  }
});

// Eliminar (admin)
actsRouter.delete("/:id", requirePermission(MODULES.SETTINGS), async (c) => {
  try {
    const db = c.get("db");
    await db.delete(acts).where(eq(acts.id, c.req.param("id"))).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Error al eliminar acta" }, 500);
  }
});
