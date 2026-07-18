/**
 * DTOs para el módulo de Perfiles
 *
 * Define los esquemas de validación para las solicitudes
 * relacionadas con la gestión de perfiles y permisos.
 *
 * @module modules/profiles/dto
 */

import { z } from "zod";
import { MODULE_LIST } from "../../../shared/constants/modules";
import { ACTION_LIST } from "../../../shared/constants/actions";

// ═══════════════════════════════════════════════════════════════
// CREAR PERFIL
// ═══════════════════════════════════════════════════════════════

/**
 * Schema para crear un nuevo perfil
 */
export const createProfileSchema = z.object({
  /** Clave única del perfil (ej: "treasurer", "secretary") */
  key: z
    .string()
    .min(2, "La clave debe tener al menos 2 caracteres")
    .max(50, "La clave no puede exceder 50 caracteres")
    .regex(
      /^[a-z0-9_]+$/,
      "La clave solo puede contener letras minúsculas, números y guiones bajos"
    ),
  /** Nombre visible del perfil */
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  /** Descripción del propósito del perfil */
  description: z
    .string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional(),
  /** Si es un perfil del sistema (solo super admin puede crear) */
  isSystem: z.boolean().optional().default(false),
  /** Si es el perfil por defecto para nuevos registros */
  isDefault: z.boolean().optional().default(false),
});

export type CreateProfileDto = z.infer<typeof createProfileSchema>;

// ═══════════════════════════════════════════════════════════════
// ACTUALIZAR PERFIL
// ═══════════════════════════════════════════════════════════════

/**
 * Schema para actualizar un perfil existente
 */
export const updateProfileSchema = z.object({
  /** Nombre visible del perfil */
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .optional(),
  /** Descripción del propósito del perfil */
  description: z
    .string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional(),
  /** Si el perfil está activo */
  isActive: z.boolean().optional(),
  /** Si es el perfil por defecto para nuevos registros */
  isDefault: z.boolean().optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

// ═══════════════════════════════════════════════════════════════
// ACTUALIZAR PERMISOS
// ═══════════════════════════════════════════════════════════════

/**
 * Schema para un permiso individual
 */
export const permissionItemSchema = z.object({
  /** Módulo al que aplica el permiso */
  module: z.enum(MODULE_LIST as [string, ...string[]]),
  /** Acción permitida */
  action: z.enum(ACTION_LIST as [string, ...string[]]),
  /** Si el permiso está activo */
  allowed: z.boolean(),
});

/**
 * Schema para actualizar los permisos de un perfil
 */
export const updatePermissionsSchema = z.object({
  /** Lista de permisos a establecer */
  permissions: z.array(permissionItemSchema),
});

export type UpdatePermissionsDto = z.infer<typeof updatePermissionsSchema>;

// ═══════════════════════════════════════════════════════════════
// ASIGNAR PERFIL A USUARIO
// ═══════════════════════════════════════════════════════════════

/**
 * Schema para asignar un perfil a un usuario
 */
export const assignProfileSchema = z.object({
  /** ID del perfil a asignar */
  profileId: z.string().uuid("ID de perfil inválido"),
});

export type AssignProfileDto = z.infer<typeof assignProfileSchema>;

// ═══════════════════════════════════════════════════════════════
// QUERY PARAMS
// ═══════════════════════════════════════════════════════════════

/**
 * Schema para query params de listado de perfiles
 */
export const profileQuerySchema = z.object({
  /** Incluir permisos en la respuesta */
  includePermissions: z.coerce.boolean().optional().default(false),
  /** Filtrar por estado activo */
  isActive: z.coerce.boolean().optional(),
  /** Filtrar solo perfiles del sistema */
  isSystem: z.coerce.boolean().optional(),
  /** Filtrar solo perfiles por defecto */
  isDefault: z.coerce.boolean().optional(),
});

export type ProfileQueryDto = z.infer<typeof profileQuerySchema>;
