import { Hono } from "hono";
import { inArray, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { user as userTable } from "../../shared/database/schemas/auth.schema";
import * as schema from "../../shared/database/schemas";
import { CENSUS_HOUSES, CENSUS_CITIZENS } from "./census-data";
import { seedRbacProfiles } from "../../shared/seed/rbac-seed";
import { seedTreasury } from "../../shared/seed/treasury-seed";
import type { HonoConfig } from "../../index";

export const seedRouter = new Hono<HonoConfig>();

seedRouter.use("/*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, X-Bootstrap-Key, X-Force-Reset");
  if (c.req.method === "OPTIONS") {
    return c.text("", 204);
  }
  await next();
});

seedRouter.post("/seed-superadmin", async (c) => {
  const db = drizzle(c.env.DB, { schema: { user: userTable } });
  const users = await db.select().from(userTable).limit(1);
  if (users.length > 0) {
    return c.json({ error: "Already seeded" }, 409);
  }
  const { email, password, name } = await c.req.json();
  const auth = betterAuth({
    database: drizzleAdapter(db, { provider: "d1", schema: { user: userTable } }),
    emailAndPassword: { enabled: true },
    secret: c.env.BETTER_AUTH_SECRET as string,
    baseURL: c.env.BETTER_AUTH_URL,
  });
  const newUser = await auth.api.createUser({
    body: {
      email,
      password,
      name,
      role: "superadmin",
    },
  });

  // Después de crear el super admin, inicializar perfiles RBAC
  const fullDb = c.get("db");
  const rbacResult = await seedRbacProfiles(fullDb, newUser.id);

  // Asignar perfil super_admin al usuario recién creado
  await fullDb.insert(schema.userProfiles).values({
    userId: newUser.id,
    profileId: rbacResult.profileIds.superAdmin,
  });

  return c.json({
    ok: true,
    user: newUser,
    rbac: rbacResult,
  });
});

// ─────────────────────────────────────────────────────────────
// POST /api/seed/seed-census
// Pobla houses → citizens (sin family_id) → families → actualiza citizens.family_id
// Idempotente por defecto. X-Force-Reset: true trunca y re-inserta todo.
// ─────────────────────────────────────────────────────────────
const CHUNK = 10; // D1 limita a 100 variables por query; citizens tiene 8 cols → máx 12 rows

seedRouter.post("/seed-census", async (c) => {
  try {
    const { bootstrapAdminKey } = c.get("runtimeSecrets");

    if (!bootstrapAdminKey || c.req.header("X-Bootstrap-Key") !== bootstrapAdminKey) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const db = c.get("db");
    const forceReset = c.req.header("X-Force-Reset") === "true";

    // ── Truncado opcional (orden respetando FKs) ──────────────
    if (forceReset) {
      await db.delete(schema.citizens).run();
      await db.delete(schema.families).run();
      await db.delete(schema.houses).run();
    }

    // ── Fase A: Casas ─────────────────────────────────────────
    const existingHouses = await db
      .select({ id: schema.houses.id, sector: schema.houses.sector, number: schema.houses.number })
      .from(schema.houses)
      .all();

    const houseMap = new Map<string, string>(); // "sector-number" → id
    for (const h of existingHouses) {
      houseMap.set(`${h.sector}-${h.number}`, h.id);
    }

    const housesToInsert = CENSUS_HOUSES
      .filter((h) => !houseMap.has(h.key))
      .map((h) => ({ id: crypto.randomUUID(), address: h.address, sector: h.sector, number: h.number, key: h.key }));

    for (const h of housesToInsert) houseMap.set(`${h.sector}-${h.number}`, h.id);

    for (let i = 0; i < housesToInsert.length; i += CHUNK) {
      const chunk = housesToInsert.slice(i, i + CHUNK);
      await db
        .insert(schema.houses)
        .values(chunk.map((h) => ({ id: h.id, address: h.address, sector: h.sector, number: h.number })))
        .run();
    }

    // ── Fase B: Ciudadanos (sin family_id) ───────────────────
    const existingCitizens = await db
      .select({ id: schema.citizens.id, dni: schema.citizens.dni })
      .from(schema.citizens)
      .all();

    const citizenMap = new Map<string, string>(); // dni → id
    for (const cit of existingCitizens) citizenMap.set(cit.dni, cit.id);

    const citizensToInsert = CENSUS_CITIZENS
      .filter((cit) => !citizenMap.has(cit.dni))
      .map((cit) => ({ id: crypto.randomUUID(), ...cit }));

    for (const cit of citizensToInsert) citizenMap.set(cit.dni, cit.id);

    for (let i = 0; i < citizensToInsert.length; i += CHUNK) {
      const chunk = citizensToInsert.slice(i, i + CHUNK);
      await db
        .insert(schema.citizens)
        .values(
          chunk.map((cit) => ({
            id: cit.id,
            dni: cit.dni,
            firstName: cit.firstName,
            lastName: cit.lastName,
            birthDate: "1900-01-01",
            gender: "SIN_ESPECIFICAR",
            isHeadOfHousehold: cit.isHead,
            familyId: null,
          })),
        )
        .run();
    }

    // ── Fase C: Familias ─────────────────────────────────────
    const existingFamilies = await db
      .select({ id: schema.families.id, name: schema.families.name })
      .from(schema.families)
      .all();

    const familyMap = new Map<string, string>(); // houseKey → family.id
    const existingFamilyNames = new Set(existingFamilies.map((f) => f.name));

    const familyRecords = CENSUS_HOUSES.map((h) => {
      const head = CENSUS_CITIZENS.find((cit) => cit.houseKey === h.key && cit.isHead);
      const familyName = `Familia ${head?.lastName ?? "SIN_APELLIDO"} - M${h.sector} #${h.number}`;
      return {
        id: crypto.randomUUID(),
        houseKey: h.key,
        name: familyName,
        houseId: houseMap.get(h.key) ?? null,
        headId: head ? (citizenMap.get(head.dni) ?? null) : null,
      };
    }).filter((f) => f.houseId && !existingFamilyNames.has(f.name));

    for (const f of familyRecords) familyMap.set(f.houseKey, f.id);

    for (let i = 0; i < familyRecords.length; i += CHUNK) {
      const chunk = familyRecords.slice(i, i + CHUNK);
      await db
        .insert(schema.families)
        .values(
          chunk.map((f) => ({
            id: f.id,
            name: f.name,
            houseId: f.houseId!,
            headId: f.headId,
          })),
        )
        .run();
    }

    // Completar el mapa con familias que ya existían
    for (const h of CENSUS_HOUSES) {
      if (familyMap.has(h.key)) continue;
      const head = CENSUS_CITIZENS.find((cit) => cit.houseKey === h.key && cit.isHead);
      const familyName = `Familia ${head?.lastName ?? "SIN_APELLIDO"} - M${h.sector} #${h.number}`;
      const existing = existingFamilies.find((f) => f.name === familyName);
      if (existing) familyMap.set(h.key, existing.id);
    }

    // ── Fase D: Actualizar family_id en ciudadanos ────────────
    const citizensByHouse = new Map<string, string[]>(); // houseKey → [citizenId, ...]
    for (const cit of citizensToInsert) {
      const id = citizenMap.get(cit.dni);
      if (!id) continue;
      if (!citizensByHouse.has(cit.houseKey)) citizensByHouse.set(cit.houseKey, []);
      citizensByHouse.get(cit.houseKey)!.push(id);
    }

    let citizensUpdated = 0;
    for (const [houseKey, ids] of citizensByHouse) {
      const familyId = familyMap.get(houseKey);
      if (!familyId || ids.length === 0) continue;

      await db
        .update(schema.citizens)
        .set({ familyId })
        .where(inArray(schema.citizens.id, ids))
        .run();

      citizensUpdated += ids.length;
    }

    return c.json({
      ok: true,
      stats: {
        housesInserted: housesToInsert.length,
        citizensInserted: citizensToInsert.length,
        familiesInserted: familyRecords.length,
        citizensUpdated,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[seed-census] Error:", err);
    return c.json({ error: message, stack }, 500);
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/seed/seed-rbac
// Inicializa los perfiles y permisos del sistema RBAC
// Idempotente: si ya existen, no los duplica
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// POST /api/seed/seed-treasury
// Popula catálogo de tesorería (categorías, conceptos, tasa del día) y,
// si hay usuarios ciudadanos, algunos pagos y egresos de muestra.
// Idempotente en el catálogo. Los pagos/egresos solo se insertan si aún no hay.
// ─────────────────────────────────────────────────────────────
seedRouter.post("/seed-treasury", async (c) => {
  try {
    const db = c.get("db");

    // Reutilizar (o crear) el usuario sistema para auditoría
    let systemUser = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, "system@manoa.local"))
      .get();

    if (!systemUser) {
      const now = new Date();
      const [inserted] = await db
        .insert(schema.user)
        .values({
          id: crypto.randomUUID(),
          name: "Sistema",
          email: "system@manoa.local",
          emailVerified: true,
          role: "superadmin",
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      systemUser = inserted;
    }

    const result = await seedTreasury(db, systemUser.id);

    return c.json({
      ok: true,
      message: "Catálogo de tesorería inicializado",
      result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[seed-treasury] Error:", err);
    return c.json({ error: message }, 500);
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/seed/fix-modules
// Limpia la tabla modules: elimina duplicados, reordena según
// el menú real del frontend (menu.ts).
// Idempotente: hace DELETE + INSERT.
// ─────────────────────────────────────────────────────────────
seedRouter.post("/fix-modules", async (c) => {
  try {
    const { bootstrapAdminKey } = c.get("runtimeSecrets");
    if (!bootstrapAdminKey || c.req.header("X-Bootstrap-Key") !== bootstrapAdminKey) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const db = c.get("db");

    // Eliminar módulos existentes
    await db.delete(schema.modules).run();

    // Insertar módulos correctos sin duplicados
    const rows = [
      ["houses",     "Viviendas",    "/houses",      "Home",         "census",   "Censo",          1],
      ["families",   "Familias",     "/families",    "Users",        "census",   "Censo",          2],
      ["citizens",   "Ciudadanos",   "/citizens",    "User",         "census",   "Censo",          3],
      ["polls",      "Proyectos",    "/polls",       "Vote",         "participation","Participación",4],
      ["events",     "Asambleas",    "/meetings",    "Calendar",     "participation","Participación",5],
      ["requests",   "Solicitudes",  "/requests",    "FileText",     "requests", "Trámites",       6],
      ["validations","Validaciones", "/validations", "ShieldCheck",  "requests", "Trámites",       7],
      ["treasury",   "Tesorería",    "/treasury",    "Wallet",       "finance",  "Tesorería",      8],
      ["laws",       "Normativas",   "/laws",        "Scale",        "system",   "Sistema",        9],
      ["ai",         "Asistente IA", "/ai-assistant","Sparkles",     "system",   "Sistema",        10],
      ["tickets",    "Reportes",     "/tickets",     "AlertTriangle","system",   "Sistema",        11],
      ["acts",       "Libro de Actas","/acts",       "FileText",     "system",   "Sistema",        12],
      ["users",      "Usuarios",     "/users",       "UserCog",      "system",   "Sistema",        13],
      ["profiles",   "Perfiles",     "/profiles",    "Shield",       "system",   "Sistema",        14],
      ["settings",   "Configuración","/settings",    "Settings",     "system",   "Sistema",        15],
    ];

    for (const r of rows) {
      await db.insert(schema.modules).values({
        key: r[0],
        name: r[1],
        route: r[2],
        icon: r[3],
        groupKey: r[4] as string,
        groupLabel: r[5] as string,
        sortOrder: r[6] as number,
      }).run();
    }

    return c.json({ ok: true, total: rows.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[fix-modules]", err);
    return c.json({ error: msg }, 500);
  }
});

seedRouter.post("/seed-rbac", async (c) => {
  try {
    const db = c.get("db");

    // Obtener o crear un usuario "sistema" para auditoría
    let systemUser = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, "system@manoa.local"))
      .get();

    if (!systemUser) {
      const now = new Date();
      const [inserted] = await db
        .insert(schema.user)
        .values({
          id: crypto.randomUUID(),
          name: "Sistema",
          email: "system@manoa.local",
          emailVerified: true,
          role: "superadmin",
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      systemUser = inserted;
    }

    const result = await seedRbacProfiles(db, systemUser.id);

    return c.json({
      ok: true,
      message: "Perfiles y permisos RBAC inicializados correctamente",
      result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[seed-rbac] Error:", err);
    return c.json({ error: message }, 500);
  }
});
