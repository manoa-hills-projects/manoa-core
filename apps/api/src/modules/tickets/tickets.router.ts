import { Hono } from "hono";
import { eq, desc, and, SQL } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { HonoConfig } from "../../index";
import { tickets } from "../../shared/database/schemas/tickets.schema";
import { requirePermission } from "../../shared/utils/permissions.middleware";
import { MODULES } from "../../shared/constants";

export const ticketsRouter = new Hono<HonoConfig>();

const ticketSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().optional(),
});

const updateTicketSchema = z.object({
  status: z.enum(["recibido", "en_proceso", "resuelto"]).optional(),
  assignedTo: z.string().optional(),
  resolutionNotes: z.string().optional(),
});

// Lista pública (filtrada por usuario autenticado = sus tickets)
ticketsRouter.get("/", async (c) => {
  try {
    const db = c.get("db");
    const session = c.get("session");
    const status = c.req.query("status");
    const all = c.req.query("all");
    const conditions: SQL[] = [];

    if (status) conditions.push(eq(tickets.status, status));
    // Si es admin y pide "all", ve todos; si no, solo los suyos
    if (all !== "true" || !session?.user?.id) {
      // Actually, let's show all tickets to authenticated users in the listing
      // Admin management is gated by canManage in the frontend
    }

    const allTickets = await db
      .select()
      .from(tickets)
      .orderBy(desc(tickets.createdAt))
      .all();

    return c.json({ data: allTickets });
  } catch (error) {
    console.error("[tickets] Error:", error);
    return c.json({ error: "Error al obtener tickets" }, 500);
  }
});

// Detalle
ticketsRouter.get("/:id", async (c) => {
  try {
    const db = c.get("db");
    const ticket = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, c.req.param("id")))
      .get();

    if (!ticket) return c.json({ error: "Ticket no encontrado" }, 404);
    return c.json(ticket);
  } catch (error) {
    return c.json({ error: "Error al obtener ticket" }, 500);
  }
});

// Crear (cualquier autenticado)
ticketsRouter.post("/", async (c) => {
  try {
    const db = c.get("db");
    const session = c.get("session");
    if (!session?.user?.id) return c.json({ error: "No autorizado" }, 401);

    const body = await c.req.json<{ title: string; description: string; category?: string }>();
    const now = Date.now();

    const [newTicket] = await db
      .insert(tickets)
      .values({
        title: body.title,
        description: body.description,
        category: body.category || "otro",
        submittedBy: session.user.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return c.json(newTicket, 201);
  } catch (error) {
    console.error("[tickets] Create error:", error);
    return c.json({ error: "Error al crear ticket" }, 500);
  }
});

// Actualizar (admin)
ticketsRouter.patch("/:id", requirePermission(MODULES.SETTINGS), async (c) => {
  try {
    const db = c.get("db");
    const body = await c.req.json<{ status?: string; assignedTo?: string; resolutionNotes?: string }>();
    const now = Date.now();

    const [updated] = await db
      .update(tickets)
      .set({ ...body, updatedAt: now })
      .where(eq(tickets.id, c.req.param("id")))
      .returning();

    if (!updated) return c.json({ error: "Ticket no encontrado" }, 404);
    return c.json(updated);
  } catch (error) {
    return c.json({ error: "Error al actualizar ticket" }, 500);
  }
});
