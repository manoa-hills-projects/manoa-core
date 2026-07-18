/**
 * Seed de Perfiles RBAC (modelo simplificado)
 *
 * Inicializa los perfiles del sistema:
 * - super_admin: short-circuit en middleware, cero filas
 * - citizen: perfil mínimo con permisos de VISUALIZACIÓN (8 filas): houses.view,
 *   families.view, citizens.view, requests.view, polls.view, laws.view, ai.view,
 *   stats.view. NO tiene permisos de gestión (zona 3).
 *
 * Los perfiles personalizados (tesorero, secretario) se crean
 * desde el panel de administración con sus filas de permisos.
 *
 * Idempotente: si los perfiles ya existen, no los duplica.
 *
 * @module seed/rbac-seed
 *
 * @example
 * POST /api/seed/seed-rbac
 *
 * @example
 * await seedRbacProfiles(db, userId);
 */

import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "../database/schemas";
import { profiles, auditLogs, profilePermissions } from "../database/schemas/rbac.schema";
import { eq } from "drizzle-orm";
import { SYSTEM_PROFILES } from "../constants/profiles";
import { AUDIT_ACTIONS } from "../types/rbac";

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL DE SEED
// ═══════════════════════════════════════════════════════════════

type Database = DrizzleD1Database<typeof schema>;

/**
 * Resultado del seed de RBAC
 */
export interface SeedRbacResult {
  /** Perfiles creados */
  profilesCreated: number;
  /** Perfiles que ya existían */
  profilesSkipped: number;
  /** IDs de los perfiles creados/existentes */
  profileIds: {
    superAdmin: string;
    citizen: string;
    treasurer: string;
  };
}

/**
 * Ejecuta el seed de perfiles RBAC
 *
 * Crea los perfiles del sistema (super_admin, citizen):
 * - super_admin: el middleware hace short-circuit, cero filas
 * - citizen: permisos de VISUALIZACIÓN (zonas 1/2): houses.view, families.view,
 *   citizens.view, requests.view, polls.view, laws.view, ai.view, stats.view.
 *   NO tiene permisos de gestión (zona 3).
 *
 * Los perfiles personalizados se crean desde el panel con sus permisos.
 *
 * @param db - Instancia de la base de datos Drizzle
 * @param userId - ID del usuario que ejecuta el seed (para auditoría)
 * @returns Resultado del seed con estadísticas
 *
 * @example
 * const result = await seedRbacProfiles(db, "user-123");
 * console.log(`Perfiles creados: ${result.profilesCreated}`);
 */
export async function seedRbacProfiles(
  db: Database,
  userId: string
): Promise<SeedRbacResult> {
  const result: SeedRbacResult = {
    profilesCreated: 0,
    profilesSkipped: 0,
    profileIds: {
      superAdmin: "",
      citizen: "",
      treasurer: "",
    },
  };

  // ── 1. Crear perfil Super Admin ─────────────────────────────
  let superAdminProfile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.key, SYSTEM_PROFILES.SUPER_ADMIN))
    .get();

  if (!superAdminProfile) {
    const [inserted] = await db
      .insert(profiles)
      .values({
        key: SYSTEM_PROFILES.SUPER_ADMIN,
        name: "Super Administrador",
        description:
          "Acceso total al sistema. Puede gestionar perfiles, permisos y todos los módulos. No se puede eliminar.",
      isSystem: true,
      isDefault: false,
      isActive: true,
      bypassesRbac: true,
      })
      .returning();

    superAdminProfile = inserted;
    result.profilesCreated++;

    // Auditoría
    await db.insert(auditLogs).values({
      userId,
      action: AUDIT_ACTIONS.PROFILE_CREATED,
      entityType: "profile",
      entityId: inserted.id,
      changes: JSON.stringify({ key: SYSTEM_PROFILES.SUPER_ADMIN, name: "Super Administrador" }),
    });
  } else {
    result.profilesSkipped++;
  }

  result.profileIds.superAdmin = superAdminProfile.id;

  // ── 2. Crear perfil Ciudadano (Vecino) ──────────────────────
  let citizenProfile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.key, SYSTEM_PROFILES.CITIZEN))
    .get();

  if (!citizenProfile) {
    const [inserted] = await db
      .insert(profiles)
      .values({
        key: SYSTEM_PROFILES.CITIZEN,
        name: "Vecino",
        description:
          "Perfil por defecto para ciudadanos registrados. Acceso a vistas públicas y sus propios datos.",
        isSystem: true,
        isDefault: true,
        isActive: true,
      })
      .returning();

    citizenProfile = inserted;
    result.profilesCreated++;

    // Auditoría
    await db.insert(auditLogs).values({
      userId,
      action: AUDIT_ACTIONS.PROFILE_CREATED,
      entityType: "profile",
      entityId: inserted.id,
      changes: JSON.stringify({ key: SYSTEM_PROFILES.CITIZEN, name: "Vecino" }),
    });
  } else {
    result.profilesSkipped++;
  }

  result.profileIds.citizen = citizenProfile.id;

  // Nota: No se crean filas en profile_permissions para los perfiles
  // del sistema. super_admin usa short-circuit en el middleware,
  // citizen solo accede a rutas /public y /mine (solo requireAuth).
  // Los perfiles personalizados se crean desde el panel con sus permisos.

  // ── 3. Agregar permisos de VISUALIZACIÓN para citizen (comunidad) ─
  const citizenViewPermissions = [
    { module: "houses", action: "view" },
    { module: "families", action: "view" },
    { module: "citizens", action: "view" },
    { module: "requests", action: "view" },
    { module: "polls", action: "view" },
    { module: "laws", action: "view" },
    { module: "ai", action: "view" },
    { module: "stats", action: "view" },
    { module: "treasury", action: "view" },
  ];

  for (const perm of citizenViewPermissions) {
    await db
      .insert(profilePermissions)
      .values({
        profileId: citizenProfile.id,
        module: perm.module,
        action: perm.action,
        allowed: true,
      })
      .onConflictDoNothing();
  }

  // ── 4. Perfil Tesorero (no-system, no-default, editable desde panel) ─
  let treasurerProfile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.key, "tesorero"))
    .get();

  if (!treasurerProfile) {
    const [inserted] = await db
      .insert(profiles)
      .values({
        key: "tesorero",
        name: "Tesorero",
        description:
          "Gestiona la tesorería del consejo comunal: publica conceptos de cobro, tasa del día, revisa pagos de ciudadanos y registra egresos.",
        isSystem: false,
        isDefault: false,
        isActive: true,
      })
      .returning();

    treasurerProfile = inserted;
    result.profilesCreated++;

    await db.insert(auditLogs).values({
      userId,
      action: AUDIT_ACTIONS.PROFILE_CREATED,
      entityType: "profile",
      entityId: inserted.id,
      changes: JSON.stringify({ key: "tesorero", name: "Tesorero" }),
    });
  } else {
    result.profilesSkipped++;
  }

  result.profileIds.treasurer = treasurerProfile.id;

  // Permisos del tesorero: gestión (zona 3) sobre treasury + payments.
  // Se incluyen las filas de "view" también para coherencia con zonas 1/2.
  const treasurerPermissions = [
    { module: "treasury", action: "view" },
    { module: "treasury", action: "manage" },
    { module: "payments", action: "view" },
    { module: "payments", action: "manage" },
  ];

  for (const perm of treasurerPermissions) {
    await db
      .insert(profilePermissions)
      .values({
        profileId: treasurerProfile.id,
        module: perm.module,
        action: perm.action,
        allowed: true,
      })
      .onConflictDoNothing();
  }

  return result;
}
