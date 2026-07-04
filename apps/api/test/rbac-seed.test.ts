/**
 * Tests para el seed de RBAC
 *
 * Valida que el seed crea correctamente los perfiles y permisos
 * del sistema usando una base de datos D1 en memoria.
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import * as schema from "../src/shared/database/schemas";
import { seedRbacProfiles } from "../src/shared/seed/rbac-seed";
import { SYSTEM_PROFILES } from "../src/shared/constants/profiles";
import {
  getTestDB,
  clearRBACTables,
  clearUsersTable,
  disposeTestDB,
} from "./helpers/d1-helper";

describe("Seed RBAC", () => {
  let db: Awaited<ReturnType<typeof getTestDB>>["db"];
  let testUserId: string;

  beforeAll(async () => {
    const testEnv = await getTestDB();
    db = testEnv.db;

    // Crear usuario de test
    testUserId = crypto.randomUUID();
    await db.insert(schema.user).values({
      id: testUserId,
      name: "Test User",
      email: "test@manoa.local",
      emailVerified: true,
      role: "superadmin",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  beforeEach(async () => {
    // Limpiar tablas RBAC antes de cada test
    await clearRBACTables();
  });

  afterAll(async () => {
    await clearUsersTable();
    await disposeTestDB();
  });

  describe("seedRbacProfiles", () => {
    it("debe crear perfiles del sistema", async () => {
      const result = await seedRbacProfiles(db as any, testUserId);

      expect(result.profilesCreated).toBe(3);
      expect(result.profileIds.superAdmin).toBeDefined();
      expect(result.profileIds.citizen).toBeDefined();
      expect(result.profileIds.treasurer).toBeDefined();
    });

    it("debe crear perfil super_admin correctamente", async () => {
      await seedRbacProfiles(db as any, testUserId);

      const superAdmin = await db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.key, SYSTEM_PROFILES.SUPER_ADMIN))
        .get();

      expect(superAdmin).toBeDefined();
      expect(superAdmin!.name).toBe("Super Administrador");
      expect(superAdmin!.isSystem).toBe(true);
      expect(superAdmin!.isDefault).toBe(false);
      expect(superAdmin!.isActive).toBe(true);
    });

    it("debe crear perfil citizen correctamente", async () => {
      await seedRbacProfiles(db as any, testUserId);

      const citizen = await db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.key, SYSTEM_PROFILES.CITIZEN))
        .get();

      expect(citizen).toBeDefined();
      expect(citizen!.name).toBe("Vecino");
      expect(citizen!.isSystem).toBe(true);
      expect(citizen!.isDefault).toBe(true);
      expect(citizen!.isActive).toBe(true);
    });

    it("debe crear permisos para super_admin", async () => {
      const result = await seedRbacProfiles(db as any, testUserId);

      const permissions = await db
        .select()
        .from(schema.profilePermissions)
        .where(eq(schema.profilePermissions.profileId, result.profileIds.superAdmin))
        .all();

      // Super admin tiene 0 filas en profile_permissions (usa short-circuit en middleware)
      expect(permissions.length).toBe(0);
    });

    it("debe crear permisos para citizen", async () => {
      const result = await seedRbacProfiles(db as any, testUserId);

      const permissions = await db
        .select()
        .from(schema.profilePermissions)
        .where(eq(schema.profilePermissions.profileId, result.profileIds.citizen))
        .all();

      // Citizen tiene 9 permisos de VISUALIZACIÓN (comunidad + tesorería)
      expect(permissions.length).toBe(9);

      // Verificar permisos de vista (Option C - comunidad)
      const hasRequestsView = permissions.some(
        (p) => p.module === "requests" && p.action === "view" && p.allowed
      );
      const hasPollsView = permissions.some(
        (p) => p.module === "polls" && p.action === "view" && p.allowed
      );

      expect(hasRequestsView).toBe(true);
      expect(hasPollsView).toBe(true);

      // Citizen NO debe tener permisos administrativos
      const hasProfilesManage = permissions.some(
        (p) => p.module === "profiles" && p.action === "manage"
      );
      const hasUsersDelete = permissions.some(
        (p) => p.module === "users" && p.action === "delete"
      );
      const hasTreasuryView = permissions.some(
        (p) => p.module === "treasury" && p.action === "view"
      );

      expect(hasProfilesManage).toBe(false);
      expect(hasUsersDelete).toBe(false);
      // Citizen SÍ debe tener treasury.view (para vista de transparencia)
      expect(hasTreasuryView).toBe(true);
    });

    it("debe ser idempotente", async () => {
      // Primera ejecución
      const result1 = await seedRbacProfiles(db as any, testUserId);
      expect(result1.profilesCreated).toBe(3);

      // Segunda ejecución
      const result2 = await seedRbacProfiles(db as any, testUserId);
      expect(result2.profilesCreated).toBe(0);
      expect(result2.profilesSkipped).toBe(3);

      // Los IDs deben ser los mismos
      expect(result2.profileIds.superAdmin).toBe(result1.profileIds.superAdmin);
      expect(result2.profileIds.citizen).toBe(result1.profileIds.citizen);
      expect(result2.profileIds.treasurer).toBe(result1.profileIds.treasurer);
    });

    it("debe crear registros de auditoría", async () => {
      await seedRbacProfiles(db as any, testUserId);

      const logs = await db.select().from(schema.auditLogs).all();

      // Debe haber 3 logs: uno por cada perfil creado (super_admin, citizen, tesorero)
      expect(logs.length).toBeGreaterThanOrEqual(3);

      // Verificar que hay logs de creación de perfiles
      const profileCreatedLogs = logs.filter(
        (l) => l.action === "profile_created"
      );
      expect(profileCreatedLogs.length).toBe(3);
    });

    it("debe crear perfil tesorero con permisos de gestión", async () => {
      const result = await seedRbacProfiles(db as any, testUserId);

      const treasurer = await db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.key, "tesorero"))
        .get();

      expect(treasurer).toBeDefined();
      expect(treasurer!.name).toBe("Tesorero");
      expect(treasurer!.isSystem).toBe(false);
      expect(treasurer!.isDefault).toBe(false);
      expect(treasurer!.isActive).toBe(true);

      const permissions = await db
        .select()
        .from(schema.profilePermissions)
        .where(
          eq(schema.profilePermissions.profileId, result.profileIds.treasurer)
        )
        .all();

      // treasury.view + treasury.manage + payments.view + payments.manage
      expect(permissions.length).toBe(4);
      expect(
        permissions.some(
          (p) => p.module === "treasury" && p.action === "manage"
        )
      ).toBe(true);
      expect(
        permissions.some(
          (p) => p.module === "payments" && p.action === "manage"
        )
      ).toBe(true);
    });
  });
});
