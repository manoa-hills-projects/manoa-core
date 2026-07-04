/**
 * Handler de Perfiles RBAC
 *
 * Contiene la lógica de negocio para la gestión de perfiles
 * y permisos del sistema RBAC.
 *
 * @module modules/profiles/handler
 */

import { eq, and, inArray } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "../../shared/database/schemas";
import {
  profiles,
  profilePermissions,
  userProfiles,
  auditLogs,
} from "../../shared/database/schemas/rbac.schema";
import { user as userTable } from "../../shared/database/schemas/auth.schema";
import {
  isSystemProfile,
  isProfileDeletable,
  SYSTEM_PROFILES,
} from "../../shared/constants/profiles";
import { AUDIT_ACTIONS } from "../../shared/types/rbac";
import { invalidateAllPermissionCache } from "../../shared/utils/permissions.middleware";
import type {
  CreateProfileDto,
  UpdateProfileDto,
  UpdatePermissionsDto,
  AssignProfileDto,
  ProfileQueryDto,
} from "./dto";

type Database = DrizzleD1Database<typeof schema>;

// ═══════════════════════════════════════════════════════════════
// ERRORES PERSONALIZADOS
// ═══════════════════════════════════════════════════════════════

export class ProfileError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "ProfileError";
  }
}

export class ProfileNotFoundError extends ProfileError {
  constructor(profileId: string) {
    super(`Perfil con ID "${profileId}" no encontrado`, 404);
    this.name = "ProfileNotFoundError";
  }
}

export class ProfileProtectedError extends ProfileError {
  constructor(operation: string) {
    super(
      `No se puede ${operation} un perfil del sistema. Estos perfiles son protegidos.`,
      403
    );
    this.name = "ProfileProtectedError";
  }
}

export class ProfileKeyExistsError extends ProfileError {
  constructor(key: string) {
    super(`Ya existe un perfil con la clave "${key}"`, 409);
    this.name = "ProfileKeyExistsError";
  }
}

// ═══════════════════════════════════════════════════════════════
// LISTAR PERFILES
// ═══════════════════════════════════════════════════════════════

/**
 * Lista todos los perfiles con filtros opcionales
 */
export async function findAllProfiles(
  db: Database,
  query: ProfileQueryDto
): Promise<{
  data: Array<{
    id: string;
    key: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    isDefault: boolean;
    isActive: boolean;
    permissions?: Array<{
      id: string;
      module: string;
      action: string;
      allowed: boolean;
    }>;
    userCount: number;
  }>;
  total: number;
}> {
  // Construir condiciones de filtro
  const conditions = [];

  if (query.isActive !== undefined) {
    conditions.push(eq(profiles.isActive, query.isActive));
  }
  if (query.isSystem !== undefined) {
    conditions.push(eq(profiles.isSystem, query.isSystem));
  }
  if (query.isDefault !== undefined) {
    conditions.push(eq(profiles.isDefault, query.isDefault));
  }

  // Obtener perfiles
  const allProfiles = await db
    .select()
    .from(profiles)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .all();

  // Obtener conteo de usuarios por perfil
  const userCounts = await db
    .select({
      profileId: userProfiles.profileId,
      count: sql<number>`count(*)`,
    })
    .from(userProfiles)
    .groupBy(userProfiles.profileId)
    .all();

  const userCountMap = new Map(userCounts.map((uc) => [uc.profileId, uc.count]));

  // Obtener permisos si se solicitan
  let permissionsMap = new Map<string, Array<{ id: string; module: string; action: string; allowed: boolean }>>();

  if (query.includePermissions) {
    const profileIds = allProfiles.map((p) => p.id);
    if (profileIds.length > 0) {
      const allPermissions = await db
        .select()
        .from(profilePermissions)
        .where(inArray(profilePermissions.profileId, profileIds))
        .all();

      for (const perm of allPermissions) {
        if (!permissionsMap.has(perm.profileId)) {
          permissionsMap.set(perm.profileId, []);
        }
        permissionsMap.get(perm.profileId)!.push({
          id: perm.id,
          module: perm.module,
          action: perm.action,
          allowed: perm.allowed,
        });
      }
    }
  }

  // Construir respuesta
  const data = allProfiles.map((p) => ({
    id: p.id,
    key: p.key,
    name: p.name,
    description: p.description,
    isSystem: p.isSystem,
    isDefault: p.isDefault,
    isActive: p.isActive,
    permissions: permissionsMap.get(p.id),
    userCount: userCountMap.get(p.id) || 0,
  }));

  return {
    data,
    total: data.length,
  };
}

// ═══════════════════════════════════════════════════════════════
// OBTENER PERFIL POR ID
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene un perfil por su ID con sus permisos
 */
export async function findProfileById(
  db: Database,
  profileId: string
): Promise<{
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isDefault: boolean;
  isActive: boolean;
  permissions: Array<{
    id: string;
    module: string;
    action: string;
    allowed: boolean;
  }>;
  userCount: number;
} | null> {
  const profile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .get();

  if (!profile) {
    return null;
  }

  const perms = await db
    .select()
    .from(profilePermissions)
    .where(eq(profilePermissions.profileId, profileId))
    .all();

  const userCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(userProfiles)
    .where(eq(userProfiles.profileId, profileId))
    .get();

  return {
    id: profile.id,
    key: profile.key,
    name: profile.name,
    description: profile.description,
    isSystem: profile.isSystem,
    isDefault: profile.isDefault,
    isActive: profile.isActive,
    permissions: perms.map((p) => ({
      id: p.id,
      module: p.module,
      action: p.action,
      allowed: p.allowed,
    })),
    userCount: userCount?.count || 0,
  };
}

// ═══════════════════════════════════════════════════════════════
// CREAR PERFIL
// ═══════════════════════════════════════════════════════════════

/**
 * Crea un nuevo perfil personalizado
 */
export async function createProfile(
  db: Database,
  data: CreateProfileDto,
  userId: string
): Promise<{
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isDefault: boolean;
  isActive: boolean;
}> {
  // Verificar que la clave no exista
  const existing = await db
    .select()
    .from(profiles)
    .where(eq(profiles.key, data.key))
    .get();

  if (existing) {
    throw new ProfileKeyExistsError(data.key);
  }

  // Si intenta crear un perfil del sistema, debe ser super admin
  // (esto ya se valida en el middleware, pero es buena práctica doble-check)
  if (data.isSystem && isSystemProfile(data.key)) {
    throw new ProfileProtectedError("crear");
  }

  // Si marca como default, desmarcar el anterior
  if (data.isDefault) {
    await db.update(profiles).set({ isDefault: false }).run();
  }

  // Crear perfil
  const [newProfile] = await db
    .insert(profiles)
    .values({
      key: data.key,
      name: data.name,
      description: data.description || null,
      isSystem: data.isSystem || false,
      isDefault: data.isDefault || false,
      isActive: true,
    })
    .returning();

  // Auditoría
  await db.insert(auditLogs).values({
    userId,
    action: AUDIT_ACTIONS.PROFILE_CREATED,
    entityType: "profile",
    entityId: newProfile.id,
    changes: JSON.stringify({ key: data.key, name: data.name }),
  });

  return newProfile;
}

// ═══════════════════════════════════════════════════════════════
// ACTUALIZAR PERFIL
// ═══════════════════════════════════════════════════════════════

/**
 * Actualiza un perfil existente
 */
export async function updateProfile(
  db: Database,
  profileId: string,
  data: UpdateProfileDto,
  userId: string
): Promise<{
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isDefault: boolean;
  isActive: boolean;
} | null> {
  const profile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .get();

  if (!profile) {
    throw new ProfileNotFoundError(profileId);
  }

  // No permitir cambiar nombre de perfiles del sistema
  if (profile.isSystem && data.name && data.name !== profile.name) {
    throw new ProfileProtectedError("renombrar");
  }

  // Si marca como default, desmarcar el anterior
  if (data.isDefault === true) {
    await db.update(profiles).set({ isDefault: false }).run();
  }

  // Actualizar
  const [updated] = await db
    .update(profiles)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
    })
    .where(eq(profiles.id, profileId))
    .returning();

  // Auditoría
  await db.insert(auditLogs).values({
    userId,
    action: AUDIT_ACTIONS.PROFILE_UPDATED,
    entityType: "profile",
    entityId: profileId,
    changes: JSON.stringify(data),
  });

  return updated;
}

// ═══════════════════════════════════════════════════════════════
// ELIMINAR PERFIL
// ═══════════════════════════════════════════════════════════════

/**
 * Elimina un perfil personalizado
 */
export async function deleteProfile(
  db: Database,
  profileId: string,
  userId: string
): Promise<{ deleted: boolean; message: string }> {
  const profile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .get();

  if (!profile) {
    throw new ProfileNotFoundError(profileId);
  }

  // Verificar que no sea un perfil protegido
  if (!isProfileDeletable(profile.key)) {
    throw new ProfileProtectedError("eliminar");
  }

  // Verificar que no tenga usuarios asignados
  const userCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(userProfiles)
    .where(eq(userProfiles.profileId, profileId))
    .get();

  if (userCount && userCount.count > 0) {
    throw new ProfileError(
      `No se puede eliminar el perfil "${profile.name}" porque tiene ${userCount.count} usuario(s) asignado(s). Reasigne los usuarios primero.`,
      400
    );
  }

  // Eliminar permisos primero (por cascade debería ser automático, pero por seguridad)
  await db
    .delete(profilePermissions)
    .where(eq(profilePermissions.profileId, profileId))
    .run();

  // Eliminar perfil
  await db.delete(profiles).where(eq(profiles.id, profileId)).run();

  // Auditoría
  await db.insert(auditLogs).values({
    userId,
    action: AUDIT_ACTIONS.PROFILE_DELETED,
    entityType: "profile",
    entityId: profileId,
    changes: JSON.stringify({ key: profile.key, name: profile.name }),
  });

  return {
    deleted: true,
    message: `Perfil "${profile.name}" eliminado correctamente`,
  };
}

// ═══════════════════════════════════════════════════════════════
// ACTUALIZAR PERMISOS
// ═══════════════════════════════════════════════════════════════

/**
 * Actualiza los permisos de un perfil
 */
export async function updatePermissions(
  db: Database,
  profileId: string,
  data: UpdatePermissionsDto,
  userId: string
): Promise<{
  profileId: string;
  permissionsUpdated: number;
}> {
  const profile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .get();

  if (!profile) {
    throw new ProfileNotFoundError(profileId);
  }

  // No permitir cambiar permisos del super admin (siempre tiene todo)
  if (profile.key === SYSTEM_PROFILES.SUPER_ADMIN) {
    throw new ProfileProtectedError("modificar permisos de");
  }

  // Eliminar permisos actuales
  await db
    .delete(profilePermissions)
    .where(eq(profilePermissions.profileId, profileId))
    .run();

  // Insertar nuevos permisos
  if (data.permissions.length > 0) {
    await db
      .insert(profilePermissions)
      .values(
        data.permissions.map((p) => ({
          profileId,
          module: p.module,
          action: p.action,
          allowed: p.allowed,
        }))
      )
      .run();
  }

  // Invalidar cache de permisos
  invalidateAllPermissionCache();

  // Auditoría
  await db.insert(auditLogs).values({
    userId,
    action: AUDIT_ACTIONS.PERMISSIONS_UPDATED,
    entityType: "profile",
    entityId: profileId,
    changes: JSON.stringify({ permissionsCount: data.permissions.length }),
  });

  return {
    profileId,
    permissionsUpdated: data.permissions.length,
  };
}

// ═══════════════════════════════════════════════════════════════
// ASIGNAR PERFIL A USUARIO
// ═══════════════════════════════════════════════════════════════

/**
 * Asigna un perfil a un usuario
 */
export async function assignProfileToUser(
  db: Database,
  targetUserId: string,
  data: AssignProfileDto,
  operatorUserId: string
): Promise<{
  userId: string;
  profileId: string;
  profileName: string;
}> {
  // Verificar que el usuario existe
  const targetUser = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, targetUserId))
    .get();

  if (!targetUser) {
    throw new ProfileError(`Usuario con ID "${targetUserId}" no encontrado`, 404);
  }

  // Verificar que el perfil existe
  const profile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, data.profileId))
    .get();

  if (!profile) {
    throw new ProfileNotFoundError(data.profileId);
  }

  // Verificar que el perfil está activo
  if (!profile.isActive) {
    throw new ProfileError(
      `No se puede asignar el perfil "${profile.name}" porque está desactivado`,
      400
    );
  }

  // Obtener perfil anterior para auditoría
  const previousProfile = await db
    .select({ profileId: userProfiles.profileId, profileKey: profiles.key })
    .from(userProfiles)
    .innerJoin(profiles, eq(userProfiles.profileId, profiles.id))
    .where(eq(userProfiles.userId, targetUserId))
    .get();

  // Eliminar asignación anterior si existe
  await db
    .delete(userProfiles)
    .where(eq(userProfiles.userId, targetUserId))
    .run();

  // Crear nueva asignación
  await db.insert(userProfiles).values({
    userId: targetUserId,
    profileId: data.profileId,
  });

  // Invalidar cache del usuario
  const { invalidatePermissionCache } = await import(
    "../../shared/utils/permissions.middleware"
  );
  invalidatePermissionCache(targetUserId);

  // Auditoría
  await db.insert(auditLogs).values({
    userId: operatorUserId,
    action: previousProfile
      ? AUDIT_ACTIONS.USER_PROFILE_CHANGED
      : AUDIT_ACTIONS.USER_PROFILE_ASSIGNED,
    entityType: "user_profile",
    entityId: targetUserId,
    changes: JSON.stringify({
      previousProfileKey: previousProfile?.profileKey || null,
      newProfileKey: profile.key,
    }),
  });

  return {
    userId: targetUserId,
    profileId: data.profileId,
    profileName: profile.name,
  };
}

// ═══════════════════════════════════════════════════════════════
// OBTENER PERFIL DE USUARIO
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene el perfil y permisos de un usuario
 */
export async function getUserProfile(
  db: Database,
  userId: string
): Promise<{
  userId: string;
  profile: {
    id: string;
    key: string;
    name: string;
    description: string | null;
  } | null;
  permissions: Array<{
    module: string;
    action: string;
    allowed: boolean;
  }>;
} | null> {
  const userProfile = await db
    .select({
      userId: userProfiles.userId,
      profileId: profiles.id,
      profileKey: profiles.key,
      profileName: profiles.name,
      profileDescription: profiles.description,
    })
    .from(userProfiles)
    .innerJoin(profiles, eq(userProfiles.profileId, profiles.id))
    .where(eq(userProfiles.userId, userId))
    .get();

  if (!userProfile) {
    return null;
  }

  const perms = await db
    .select({
      module: profilePermissions.module,
      action: profilePermissions.action,
      allowed: profilePermissions.allowed,
    })
    .from(profilePermissions)
    .where(eq(profilePermissions.profileId, userProfile.profileId))
    .all();

  return {
    userId: userProfile.userId,
    profile: {
      id: userProfile.profileId,
      key: userProfile.profileKey,
      name: userProfile.profileName,
      description: userProfile.profileDescription,
    },
    permissions: perms,
  };
}

// Import necesario para sql
import { sql } from "drizzle-orm";
