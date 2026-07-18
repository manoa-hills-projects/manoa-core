/**
 * Modules Router
 *
 * Expone los módulos del sistema para el frontend.
 * GET /api/modules → Lista todos los módulos activos
 */

import { Hono } from "hono";
import { eq } from "drizzle-orm";
import type { HonoConfig } from "../../index";
import { modules } from "../../shared/database/schemas/modules.schema";

export const modulesRouter = new Hono<HonoConfig>();

/**
 * GET /api/modules
 *
 * Devuelve todos los módulos activos del sistema, ordenados por sort_order.
 * No requiere permisos porque los módulos son metadata pública para el frontend.
 */
modulesRouter.get("/", async (c) => {
  try {
    const db = c.get("db");

    const allModules = await db
      .select()
      .from(modules)
      .where(eq(modules.isActive, true))
      .orderBy(modules.sortOrder)
      .all();

    return c.json({ data: allModules });
  } catch (error) {
    console.error("[modules] Error fetching modules:", error);
    return c.json({ error: "Error al obtener módulos" }, 500);
  }
});
