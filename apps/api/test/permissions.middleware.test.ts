/**
 * Tests para el middleware de permisos RBAC (modelo simplificado)
 *
 * Valida que requirePermission(module) verifica correctamente
 * el acceso basado en perfiles: cualquier fila en profile_permissions
 * para el módulo = acceso concedido. Sin granularidad por acción.
 *
 * Modelo Option C (Mix):
 * - super_admin: short-circuit, cero filas, acceso total
 * - citizen: filas de VISUALIZACIÓN (houses.view, families.view, etc.)
 *   para zonas 1/2 (ver transparencia y propios datos)
 * - personalizado: filas en profile_permissions = acceso a esos módulos
 *
 * @see https://hono.dev/docs/guides/testing
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import * as schema from "../src/shared/database/schemas";
import { requirePermission } from "../src/shared/utils/permissions.middleware";
import { seedRbacProfiles } from "../src/shared/seed/rbac-seed";
import { MODULES } from "../src/shared/constants";
import {
  getTestDB,
  clearRBACTables,
  clearUsersTable,
  disposeTestDB,
} from "./helpers/d1-helper";
import { createFakeKV, type FakeKV } from "./helpers/fake-kv";

describe("Middleware requirePermission (modelo simplificado)", () => {
  let db: Awaited<ReturnType<typeof getTestDB>>["db"];
  let kv: FakeKV;
  let superAdminUserId: string;
  let citizenUserId: string;
  let customProfileUserId: string;
  let customProfileId: string;

  beforeAll(async () => {
    const testEnv = await getTestDB();
    db = testEnv.db;
    kv = createFakeKV();

    // Ejecutar seed de RBAC (crea super_admin y citizen sin filas de permisos)
    superAdminUserId = crypto.randomUUID();
    await db.insert(schema.user).values({
      id: superAdminUserId,
      name: "Super Admin",
      email: "admin@manoa.local",
      emailVerified: true,
      role: "superadmin",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const seedResult = await seedRbacProfiles(db as any, superAdminUserId);

    // Asignar perfil super_admin al usuario
    await db.insert(schema.userProfiles).values({
      userId: superAdminUserId,
      profileId: seedResult.profileIds.superAdmin,
    });

    // Crear usuario citizen
    citizenUserId = crypto.randomUUID();
    await db.insert(schema.user).values({
      id: citizenUserId,
      name: "Citizen",
      email: "citizen@manoa.local",
      emailVerified: true,
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Asignar perfil citizen al usuario
    await db.insert(schema.userProfiles).values({
      userId: citizenUserId,
      profileId: seedResult.profileIds.citizen,
    });

    // Crear perfil personalizado (ej: tesorero) con permisos sobre treasury y payments
    customProfileId = crypto.randomUUID();
    await db.insert(schema.profiles).values({
      id: customProfileId,
      key: "treasurer",
      name: "Tesorero",
      description: "Perfil de prueba para tesorería",
      isSystem: false,
      isDefault: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Permiso: tesorero puede gestionar treasury y payments (action="manage" = gestión)
    await db.insert(schema.profilePermissions).values([
      {
        profileId: customProfileId,
        module: MODULES.TREASURY,
        action: "manage",
        allowed: true,
      },
      {
        profileId: customProfileId,
        module: MODULES.PAYMENTS,
        action: "manage",
        allowed: true,
      },
    ]);

    // Crear usuario con perfil personalizado
    customProfileUserId = crypto.randomUUID();
    await db.insert(schema.user).values({
      id: customProfileUserId,
      name: "Treasurer",
      email: "treasurer@manoa.local",
      emailVerified: true,
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(schema.userProfiles).values({
      userId: customProfileUserId,
      profileId: customProfileId,
    });
  });

  beforeEach(async () => {
    // Limpiar cache KV antes de cada test
    kv.clear();
  });

  afterAll(async () => {
    await clearRBACTables();
    await clearUsersTable();
    await disposeTestDB();
  });

  /**
   * Helper para crear una app de test con el middleware
   *
   * Modelo simplificado: requirePermission(module) con 1 solo arg.
   */
  function createTestApp(
    module: string,
    session: { user: { id: string; role?: string } } | null
  ) {
    const app = new Hono();

    // Middleware que simula el setup del contexto (como en index.ts)
    app.use("*", async (c, next) => {
      c.set("db" as any, db);
      if (session) {
        c.set("session" as any, session);
      }
      await next();
    });

    // Ruta protegida con el middleware de permisos (1 arg)
    app.get("/test", requirePermission(module as any), (c) => {
      return c.json({ success: true, message: "Acceso permitido" });
    });

    return app;
  }

  function request(app: Hono) {
    return app.request(
      "/test",
      {},
      { PERMISSIONS_CACHE: kv } as unknown as Record<string, unknown>
    );
  }

  describe("Super Admin", () => {
    it("debe permitir acceso a cualquier módulo (short-circuit)", async () => {
      const app = createTestApp(MODULES.CITIZENS, {
        user: { id: superAdminUserId, role: "superadmin" },
      });

      const res = await request(app);

      expect(res.status).toBe(200);
      const data = (await res.json()) as { success: boolean };
      expect(data.success).toBe(true);
    });

    it("debe permitir acceso a módulos administrativos", async () => {
      const app = createTestApp(MODULES.PROFILES, {
        user: { id: superAdminUserId, role: "superadmin" },
      });

      const res = await request(app);

      expect(res.status).toBe(200);
    });

    it("debe permitir acceso a gestión de usuarios", async () => {
      const app = createTestApp(MODULES.USERS, {
        user: { id: superAdminUserId, role: "superadmin" },
      });

      const res = await request(app);

      expect(res.status).toBe(200);
    });
  });

  describe("Citizen (con permisos de vista, no de gestión)", () => {
    // En el modelo 3-zonas, requirePermission verifica permisos de GESTIÓN (zona 3)
    // Los permisos de vista (action="view") NO habilitan gestión
    // citizen tiene requests.view pero NO requests.manage
    //
    // NOTA: POST /requests NO usa requirePermission (zona 2 - cualquier autenticado crea).
    // requirePermission solo se usa para GESTIÓN (review, delete, etc.)

    it("debe denegar gestión de requests (solo tiene view, no manage)", async () => {
      const app = createTestApp(MODULES.REQUESTS, {
        user: { id: citizenUserId, role: "user" },
      });

      const res = await request(app);

      // citizen tiene requests.view pero NO requests.manage → 403
      expect(res.status).toBe(403);
    });

    it("debe denegar gestión de polls (solo tiene view)", async () => {
      const app = createTestApp(MODULES.POLLS, {
        user: { id: citizenUserId, role: "user" },
      });

      const res = await request(app);

      expect(res.status).toBe(403);
    });

    it("debe denegar acceso a módulos administrativos (profiles)", async () => {
      const app = createTestApp(MODULES.PROFILES, {
        user: { id: citizenUserId, role: "user" },
      });

      const res = await request(app);

      expect(res.status).toBe(403);
      const data = (await res.json()) as { error: string };
      expect(data.error).toBe("Acceso denegado");
    });

    it("debe denegar acceso a gestión de usuarios", async () => {
      const app = createTestApp(MODULES.USERS, {
        user: { id: citizenUserId, role: "user" },
      });

      const res = await request(app);

      expect(res.status).toBe(403);
    });

    it("debe denegar acceso a tesorería (no tiene treasury)", async () => {
      const app = createTestApp(MODULES.TREASURY, {
        user: { id: citizenUserId, role: "user" },
      });

      const res = await request(app);

      expect(res.status).toBe(403);
    });
  });

  describe("Perfil personalizado (con permisos de gestión)", () => {
    // El tesorero tiene treasury.manage y payments.manage

    it("debe permitir acceso a gestión de treasury (tiene treasury.manage)", async () => {
      const app = createTestApp(MODULES.TREASURY, {
        user: { id: customProfileUserId, role: "user" },
      });

      const res = await request(app);

      expect(res.status).toBe(200);
      const data = (await res.json()) as { success: boolean };
      expect(data.success).toBe(true);
    });

    it("debe permitir acceso a gestión de payments (tiene payments.manage)", async () => {
      const app = createTestApp(MODULES.PAYMENTS, {
        user: { id: customProfileUserId, role: "user" },
      });

      const res = await request(app);

      expect(res.status).toBe(200);
    });

    it("debe denegar acceso a módulos NO asignados (citizens)", async () => {
      const app = createTestApp(MODULES.CITIZENS, {
        user: { id: customProfileUserId, role: "user" },
      });

      const res = await request(app);

      expect(res.status).toBe(403);
    });

    it("debe denegar acceso a módulos NO asignados (profiles)", async () => {
      const app = createTestApp(MODULES.PROFILES, {
        user: { id: customProfileUserId, role: "user" },
      });

      const res = await request(app);

      expect(res.status).toBe(403);
    });
  });

  describe("Sin sesión", () => {
    it("debe retornar 401 sin sesión", async () => {
      const app = createTestApp(MODULES.CITIZENS, null);

      const res = await request(app);

      expect(res.status).toBe(401);
      const data = (await res.json()) as { error: string };
      expect(data.error).toBe("No autorizado");
    });
  });

  describe("Sin perfil asignado", () => {
    it("debe retornar 403 si el usuario no tiene perfil", async () => {
      // Crear usuario sin perfil
      const userWithoutProfileId = crypto.randomUUID();
      await db.insert(schema.user).values({
        id: userWithoutProfileId,
        name: "No Profile",
        email: `noprofile_${Date.now()}@manoa.local`,
        emailVerified: true,
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const app = createTestApp(MODULES.CITIZENS, {
        user: { id: userWithoutProfileId, role: "user" },
      });

      const res = await request(app);

      expect(res.status).toBe(403);
      const data = (await res.json()) as { error: string };
      expect(data.error).toBe("Sin perfil asignado");
    });
  });

  describe("Perfil desactivado (isActive = false)", () => {
    // Regression: desactivar un perfil debe revocar acceso de sus usuarios.
    // Antes del fix, getUserPermissions ignoraba isActive y el cache mantenía
    // permisos hasta el TTL. Estos tests validan que ambos vectores están cerrados.

    it("debe retornar 403 cuando el perfil del usuario está desactivado", async () => {
      // Desactivar el perfil personalizado
      await db
        .update(schema.profiles)
        .set({ isActive: false })
        .where(eq(schema.profiles.id, customProfileId))
        .run();

      try {
        const app = createTestApp(MODULES.TREASURY, {
          user: { id: customProfileUserId, role: "user" },
        });

        const res = await request(app);

        expect(res.status).toBe(403);
        const data = (await res.json()) as { error: string };
        expect(data.error).toBe("Sin perfil asignado");
      } finally {
        // Restaurar el perfil para no contaminar otros tests
        await db
          .update(schema.profiles)
          .set({ isActive: true })
          .where(eq(schema.profiles.id, customProfileId))
          .run();
      }
    });

    it("debe reflejar la desactivación aunque haya cache previo (invalidación por perfil)", async () => {
      // 1. Warm-up: primera request cachea el permiso en KV
      const app = createTestApp(MODULES.TREASURY, {
        user: { id: customProfileUserId, role: "user" },
      });
      const first = await request(app);
      expect(first.status).toBe(200);
      expect(kv._size()).toBeGreaterThan(0);

      // 2. Simular flujo de updateProfile con isActive=false:
      //    desactivar el perfil + invalidar cache de sus usuarios.
      await db
        .update(schema.profiles)
        .set({ isActive: false })
        .where(eq(schema.profiles.id, customProfileId))
        .run();

      const { invalidatePermissionCacheForProfile } = await import(
        "../src/shared/utils/permissions.middleware"
      );
      await invalidatePermissionCacheForProfile(db as any, kv, customProfileId);

      try {
        // 3. La siguiente request debe ver la desactivación de inmediato
        const second = await request(app);
        expect(second.status).toBe(403);
      } finally {
        await db
          .update(schema.profiles)
          .set({ isActive: true })
          .where(eq(schema.profiles.id, customProfileId))
          .run();
      }
    });
  });
});
