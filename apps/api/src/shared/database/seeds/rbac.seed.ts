/**
 * Seed de RBAC - Perfiles del Sistema
 *
 * Crea los perfiles base del sistema:
 *
 * - `super_admin`: cero filas. El middleware hace short-circuit para este
 *   perfil y concede acceso total a la Zona 3 (admin) de todos los módulos.
 * - `citizen`: 8 filas de VISUALIZACIÓN para zonas 1/2 (comunidad): houses.view,
 *   families.view, citizens.view, requests.view, polls.view, laws.view, ai.view,
 *   stats.view. NO tiene permisos de gestión (zona 3).
 *
 * Los perfiles personalizados (tesorero, secretario, etc.) NO se crean en el
 * seed: se crean después desde el panel de administración y, al hacerlo, se
 * insertan sus filas en `profile_permissions` (una fila por módulo gestionado).
 *
 * @module seeds/rbac
 */

import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../schemas";
import { SYSTEM_PROFILES } from "../../constants/profiles";

type Database = DrizzleD1Database<typeof schema>;

/**
 * Resultado del seed de RBAC.
 *
 * No incluye conteo de permisos: en el modelo simplificado los perfiles del
 * sistema se crean con cero filas en `profile_permissions`.
 */
export interface RbacSeedResult {
  profilesCreated: number;
  profilesSkipped: number;
  profileIds: {
    superAdmin: string;
    citizen: string;
  };
}

/**
 * Ejecuta el seed de RBAC.
 *
 * Crea los perfiles del sistema (`super_admin` y `citizen`) de forma
 * idempotente (select-then-insert). No inserta filas en `profile_permissions`:
 * en el modelo simplificado ambos perfiles operan con cero permisos.
 */
export async function seedRbac(db: Database): Promise<RbacSeedResult> {
  const result: RbacSeedResult = {
    profilesCreated: 0,
    profilesSkipped: 0,
    profileIds: {
      superAdmin: "",
      citizen: "",
    },
  };

  console.log("🔐 Seed RBAC: Creando perfiles del sistema (sin permisos)...");

  // 1. Crear perfil Super Admin
  let superAdminProfile = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.key, SYSTEM_PROFILES.SUPER_ADMIN))
    .get();

  if (!superAdminProfile) {
    const [inserted] = await db
      .insert(schema.profiles)
      .values({
        key: SYSTEM_PROFILES.SUPER_ADMIN,
        name: "Super Administrador",
        description: "Acceso total al sistema. Puede gestionar perfiles, permisos y todos los módulos.",
        isSystem: true,
        isDefault: false,
        isActive: true,
      })
      .returning();

    superAdminProfile = inserted;
    result.profilesCreated++;
    console.log("   ✅ Perfil 'super_admin' creado (cero permisos)");
  } else {
    result.profilesSkipped++;
    console.log("   ⏭️  Perfil 'super_admin' ya existe");
  }

  result.profileIds.superAdmin = superAdminProfile.id;

  // 2. Crear perfil Ciudadano (Vecino)
  let citizenProfile = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.key, SYSTEM_PROFILES.CITIZEN))
    .get();

  if (!citizenProfile) {
    const [inserted] = await db
      .insert(schema.profiles)
      .values({
        key: SYSTEM_PROFILES.CITIZEN,
        name: "Vecino",
        description: "Perfil por defecto para ciudadanos registrados. Acceso limitado a sus datos.",
        isSystem: true,
        isDefault: true,
        isActive: true,
      })
      .returning();

    citizenProfile = inserted;
    result.profilesCreated++;
    console.log("   ✅ Perfil 'citizen' creado (cero permisos)");
  } else {
    result.profilesSkipped++;
    console.log("   ⏭️  Perfil 'citizen' ya existe");
  }

  result.profileIds.citizen = citizenProfile.id;

  // 3. Agregar permisos de VISUALIZACIÓN para citizen (comunidad)
  // citizen puede ver transparencia y sus propios datos en zonas 1/2
  const citizenViewPermissions = [
    { module: "houses", action: "view" },
    { module: "families", action: "view" },
    { module: "citizens", action: "view" },
    { module: "requests", action: "view" },
    { module: "polls", action: "view" },
    { module: "laws", action: "view" },
    { module: "ai", action: "view" },
    { module: "stats", action: "view" },
  ];

  for (const perm of citizenViewPermissions) {
    const [inserted] = await db
      .insert(schema.profilePermissions)
      .values({
        profileId: citizenProfile.id,
        module: perm.module,
        action: perm.action,
        allowed: true,
      })
      .onConflictDoNothing()
      .returning();
    if (inserted) {
      console.log(`   ✅ Permiso '${perm.module}.${perm.action}' agregado para citizen`);
    }
  }

  return result;
}
