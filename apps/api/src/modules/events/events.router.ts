import { Hono } from "hono";
import { eq, desc, and, SQL } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { HonoConfig } from "../../index";
import { events } from "../../shared/database/schemas/events.schema";
import { requirePermission } from "../../shared/utils/permissions.middleware";
import { MODULES } from "../../shared/constants";

export const eventsRouter = new Hono<HonoConfig>();

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.string().min(1),
  time: z.string().optional(),
  duration: z.number().optional(),
  location: z.string().optional(),
  jitsiRoomName: z.string().optional(),
  status: z.enum(["scheduled", "active", "completed", "cancelled"]).optional(),
});

const updateSchema = createSchema.partial();

// GET /events — list all
eventsRouter.get("/", async (c) => {
  const db = c.get("db");
  const session = c.get("session");
  const status = c.req.query("status");
  const conditions: SQL[] = [];

  if (status) conditions.push(eq(events.status, status));

  const all = await db
    .select()
    .from(events)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(events.createdAt))
    .all();

  return c.json({ data: all });
});

// GET /events/upcoming — próximas asambleas
eventsRouter.get("/upcoming", async (c) => {
  const db = c.get("db");
  const today = new Date().toISOString().split("T")[0];
  const all = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.status, "scheduled"),
        SQL`${events.date} >= ${today}`
      )
    )
    .orderBy(events.date)
    .all();
  return c.json({ data: all });
});

// GET /events/:id
eventsRouter.get("/:id", async (c) => {
  const db = c.get("db");
  const event = await db.select().from(events).where(eq(events.id, c.req.param("id"))).get();
  if (!event) return c.json({ error: "No encontrada" }, 404);
  return c.json(event);
});

// POST /events — create (admin)
eventsRouter.post("/", requirePermission(MODULES.SETTINGS), zValidator("json", createSchema), async (c) => {
  const db = c.get("db");
  const data = c.req.valid("json");
  const session = c.get("session");

  const [created] = await db
    .insert(events)
    .values({
      ...data,
      createdBy: session?.user?.id,
    })
    .returning();

  return c.json(created, 201);
});

// PATCH /events/:id — update (admin)
eventsRouter.patch("/:id", requirePermission(MODULES.SETTINGS), zValidator("json", updateSchema), async (c) => {
  const db = c.get("db");
  const data = c.req.valid("json");
  const [updated] = await db
    .update(events)
    .set(data)
    .where(eq(events.id, c.req.param("id")))
    .returning();
  if (!updated) return c.json({ error: "No encontrada" }, 404);
  return c.json(updated);
});

// DELETE /events/:id — delete (admin)
eventsRouter.delete("/:id", requirePermission(MODULES.SETTINGS), async (c) => {
  const db = c.get("db");
  await db.delete(events).where(eq(events.id, c.req.param("id"))).run();
  return c.json({ message: "Eliminada" });
});
