/**
 * Tipos del Sistema RBAC
 *
 * Define las interfaces y tipos utilizados en el sistema de
 * control de acceso basado en perfiles.
 *
 * @module types/rbac
 */

import type { Module, MODULES } from "../constants/modules";
import type { Action, ACTIONS } from "../constants/actions";
import type { Profile, ProfilePermission, UserProfile } from "../database/schemas/rbac.schema";

// ═══════════════════════════════════════════════════════════════
// TIPOS BÁSICOS
// ═══════════════════════════════════════════════════════════════

/**
 * Permiso individual con información completa
 */
export interface Permission {
  /** ID del permiso */
  id: string;
  /** Módulo al que aplica */
  module: Module;
  /** Acción permitida */
  action: Action;
  /** Si el permiso está activo */
  allowed: boolean;
}

/**
 * Perfil con sus permisos asociados
 */
export interface ProfileWithPermissions extends Profile {
  /** Lista de permisos del perfil */
  permissions: Permission[];
}

/**
 * Usuario con su perfil asociado
 */
export interface UserWithProfile {
  /** ID del usuario */
  id: string;
  /** Nombre del usuario */
  name: string;
  /** Email del usuario */
  email: string;
  /** Perfil asignado al usuario */
  profile: Profile | null;
  /** Permisos del perfil (para acceso rápido) */
  permissions: Permission[];
}

// ═══════════════════════════════════════════════════════════════
// TIPOS PARA VERIFICACIÓN DE PERMISOS
// ═══════════════════════════════════════════════════════════════

/**
 * Resultado de una verificación de permiso
 */
export interface PermissionCheckResult {
  /** Si el permiso fue concedido */
  allowed: boolean;
  /** Módulo verificado */
  module: Module;
  /** Acción verificada */
  action: Action;
  /** Razón si fue denegado */
  reason?: string;
}

/**
 * Contexto de permisos del usuario en sesión
 */
export interface PermissionContext {
  /** ID del usuario */
  userId: string;
  /** Clave del perfil del usuario */
  profileKey: string;
  /** Nombre del perfil */
  profileName: string;
  /** Si es super admin (acceso total) */
  isSuperAdmin: boolean;
  /** Mapa de permisos para acceso rápido */
  permissions: Map<string, boolean>;
}

// ═══════════════════════════════════════════════════════════════
// TIPOS PARA MATRIZ DE PERMISOS
// ═══════════════════════════════════════════════════════════════

/**
 * Entrada de la matriz de permisos para un módulo
 */
export interface ModulePermissionEntry {
  /** Módulo */
  module: Module;
  /** Etiqueta legible del módulo */
  label: string;
  /** Acciones disponibles y su estado */
  actions: Record<Action, boolean>;
}

/**
 * Matriz completa de permisos para un perfil
 */
export type PermissionMatrix = ModulePermissionEntry[];

// ═══════════════════════════════════════════════════════════════
// TIPOS PARA AUDITORÍA
// ═══════════════════════════════════════════════════════════════

/**
 * Tipos de acciones de auditoría
 */
export const AUDIT_ACTIONS = {
  PROFILE_CREATED: "profile_created",
  PROFILE_UPDATED: "profile_updated",
  PROFILE_DELETED: "profile_deleted",
  PERMISSIONS_UPDATED: "permissions_updated",
  USER_PROFILE_ASSIGNED: "user_profile_assigned",
  USER_PROFILE_CHANGED: "user_profile_changed",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

/**
 * Datos para un registro de auditoría
 */
export interface AuditLogData {
  /** ID del usuario que realizó la acción */
  userId: string;
  /** Tipo de acción */
  action: AuditAction;
  /** Tipo de entidad afectada */
  entityType?: string;
  /** ID de la entidad afectada */
  entityId?: string;
  /** Cambios realizados (JSON) */
  changes?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════
// TIPOS PARA DTOs
// ═══════════════════════════════════════════════════════════════

/**
 * DTO para crear un nuevo perfil
 */
export interface CreateProfileDto {
  /** Clave única del perfil */
  key: string;
  /** Nombre visible */
  name: string;
  /** Descripción */
  description?: string;
  /** Si es del sistema (solo super admin puede crear) */
  isSystem?: boolean;
  /** Si es el perfil por defecto para nuevos registros */
  isDefault?: boolean;
}

/**
 * DTO para actualizar un perfil
 */
export interface UpdateProfileDto {
  /** Nombre visible */
  name?: string;
  /** Descripción */
  description?: string;
  /** Si está activo */
  isActive?: boolean;
  /** Si es el perfil por defecto */
  isDefault?: boolean;
}

/**
 * DTO para actualizar permisos de un perfil
 */
export interface UpdatePermissionsDto {
  /** Lista de permisos a establecer */
  permissions: Array<{
    module: Module;
    action: Action;
    allowed: boolean;
  }>;
}

/**
 * DTO para asignar perfil a un usuario
 */
export interface AssignProfileDto {
  /** ID del perfil a asignar */
  profileId: string;
}

// ═══════════════════════════════════════════════════════════════
// TIPOS AUXILIARES
// ═══════════════════════════════════════════════════════════════

/**
 * Clave única para un permiso (usado en mapas)
 */
export const createPermissionKey = (module: Module | string, action: Action | string): string => {
  return `${module}:${action}`;
};

/**
 * Parsea una clave de permiso en módulo y acción
 */
export const parsePermissionKey = (key: string): { module: string; action: string } | null => {
  const parts = key.split(":");
  if (parts.length !== 2) return null;
  return { module: parts[0], action: parts[1] };
};

/**
 * Convierte un ProfilePermission de la BD a un Permission
 */
export const toPermission = (pp: ProfilePermission): Permission => ({
  id: pp.id,
  module: pp.module as Module,
  action: pp.action as Action,
  allowed: pp.allowed,
});

/**
 * Convierte una lista de ProfilePermission a un mapa de permisos
 */
export const toPermissionMap = (permissions: ProfilePermission[]): Map<string, boolean> => {
  const map = new Map<string, boolean>();
  for (const p of permissions) {
    map.set(createPermissionKey(p.module, p.action), p.allowed);
  }
  return map;
};
