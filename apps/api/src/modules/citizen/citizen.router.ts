import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { HonoConfig } from "../../index";
import { zValidator } from "@hono/zod-validator";
import * as schema from "../../shared/database/schemas";
import { createCitizen, findAllCitizens, updateCitizen, findOneCitizen, deleteCitizen } from "./citizen.handler";
import { createCitizenDto, updateCitizenDto, citizenQueryDto } from "./dto";
import { requirePermission, getUserPermissions } from "../../shared/utils/permissions.middleware";
import { MODULES } from "../../shared/constants";

const citizensRouter = new Hono<HonoConfig>()

// ─── ZONA 2: Ciudadano autenticado — crea su propio registro ───
.post("/", zValidator("json", createCitizenDto), async (c) => {
  const data = c.req.valid("json");
  const db = c.get('db');
  const session = c.get('session');

  // SESSION pasó por requireAuth (a nivel /citizens/*). Si no hay sesión, 401.
  if (!session?.user) {
    return c.json({ error: "No autorizado" }, 401);
  }

  // Forzar user_id al ciudadano autenticado por seguridad
  const result = await createCitizen(db, { ...data, user_id: session.user.id });

  if ("error" in result) {
    return c.json({ message: result.error }, result.status as 400 | 409 | 500);
  }
  return c.json(result, 201);
})

// ─── ZONA 1/2: Listar ciudadanos ───
.get("/", zValidator("query", citizenQueryDto), async (c) => {
  const db = c.get('db');
  const session = c.get('session');
  const query = c.req.valid("query");

  if (query.mine === "true") {
    if (!session?.user) {
      return c.json({ error: "No autorizado" }, 401);
    }
    const result = await findAllCitizens(db, { ...query, user_id: session.user.id });
    return c.json(result, 200);
  }

  // Zone 1: cualquier autenticado puede ver listado público
  const result = await findAllCitizens(db, query);
  return c.json(result, 200);
})

// ─── ZONA 1: Check DNI (público con auth) ───
.get("/check-dni", zValidator("query", z.object({ dni: z.string(), exclude_id: z.string().optional() })), async (c) => {
  const db = c.get('db');
  const { dni, exclude_id } = c.req.valid("query");

  const result = await db
    .select({ id: schema.citizens.id })
    .from(schema.citizens)
    .where(eq(schema.citizens.dni, dni))
    .get();

  const exists = result && result.id !== exclude_id;
  return c.json({ exists: !!exists });
})

// ─── ZONA 2: Ciudadano vinculado al usuario autenticado ───
.get("/me", async (c) => {
  const db = c.get('db');
  const session = c.get('session');

  if (!session?.user) {
    return c.json({ error: "No autorizado" }, 401);
  }

  const citizen = await db
    .select()
    .from(schema.citizens)
    .where(eq(schema.citizens.userId, session.user.id))
    .get();

  if (!citizen) {
    return c.json({ data: null });
  }

  return c.json({
    data: {
      id: citizen.id,
      cedula: citizen.dni,
      dni_type: citizen.dniType,
      phone: citizen.phone,
      names: citizen.firstName,
      surnames: citizen.lastName,
      birth_date: citizen.birthDate,
      gender: citizen.gender,
      is_head_of_household: citizen.isHeadOfHousehold,
      family_id: citizen.familyId,
      user_id: citizen.userId,
    },
  });
})

// ─── ZONA 2/3: Ver detalle de un ciudadano ───
.get("/:id", async (c) => {
  const db = c.get('db');
  const session = c.get('session');
  const id = c.req.param("id");

  if (!session?.user) {
    return c.json({ error: "No autorizado" }, 401);
  }

  const result = await findOneCitizen(db, id);
  if (!result.data) return c.json({ error: "No encontrado" }, 404);

  const citizen = result.data;

  // Propietario o admin (bypassRbac)
  if (citizen.user_id === session.user.id) return c.json(result, 200);

  const userPerms = await getUserPermissions(db, c.env.PERMISSIONS_CACHE, session.user.id);
  if (userPerms?.bypassesRbac) return c.json(result, 200);

  return c.json({ error: "No encontrado" }, 404);
})

// ─── ZONA 2: Ciudadano edita su propio registro / ZONA 3: Admin edita cualquiera ───
.patch("/:id", zValidator("json", updateCitizenDto), async (c) => {
  const data = c.req.valid("json");
  const db = c.get('db');
  const id = c.req.param("id");
  const session = c.get('session');

  if (!session?.user) return c.json({ error: "No autorizado" }, 401);

  // Si no es el propietario, verificar permiso de admin
  const existing = await findOneCitizen(db, id);
  if (existing.data?.user_id !== session.user.id) {
    const userPerms = await getUserPermissions(db, c.env.PERMISSIONS_CACHE, session.user.id);
    if (!userPerms?.bypassesRbac) {
      return c.json({ error: "No autorizado" }, 403);
    }
  }

  const result = await updateCitizen(db, id, data);
  return c.json(result, 200);
})

// ─── ZONA 3: Solo admin elimina ───
.delete("/:id", requirePermission(MODULES.CITIZENS), async (c) => {
  const db = c.get('db');
  const id = c.req.param("id");

  const result = await deleteCitizen(db, id);
  return c.json(result, 200);
});

export default citizensRouter;
