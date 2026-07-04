import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import type { HonoConfig } from "../../index";
import * as schema from "../../shared/database/schemas";
import { requirePermission } from "../../shared/utils/permissions.middleware";
import { MODULES } from "../../shared/constants/modules";

const SINGLETON_ID = "singleton";

const profileSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(200),
  rif: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email("Correo inválido").max(100).optional().nullable().or(z.literal("")),
  description: z.string().max(1000).optional().nullable(),
});

export const settingsRouter = new Hono<HonoConfig>()

  .get("/profile", async (c) => {
    const db = c.get("db");
    const row = await db
      .select()
      .from(schema.councilProfile)
      .where(eq(schema.councilProfile.id, SINGLETON_ID))
      .get();

    return c.json({
      data: row ?? {
        id: SINGLETON_ID,
        name: "Consejo Comunal",
        rif: null,
        address: null,
        phone: null,
        email: null,
        description: null,
        updatedAt: null,
      },
    });
  })

  .put("/profile", requirePermission(MODULES.SETTINGS), zValidator("json", profileSchema), async (c) => {
    const body = c.req.valid("json");
    const db = c.get("db");

    const updated = await db
      .insert(schema.councilProfile)
      .values({ id: SINGLETON_ID, ...body })
      .onConflictDoUpdate({
        target: schema.councilProfile.id,
        set: { ...body, updatedAt: new Date() },
      })
      .returning()
      .get();

    return c.json({ data: updated });
  });
