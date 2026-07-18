/**
 * RBAC Schema - Sistema de Control de Acceso Basado en Perfiles
 *
 * Este schema implementa un sistema flexible de permisos donde:
 * - Los perfiles definen conjuntos de permisos (ej: "Administrador", "Vecino")
 * - Los permisos son granulares por módulo y acción
 * - Cada usuario tiene UN perfil asignado
 * - Los perfiles del sistema (super_admin, citizen) no se pueden eliminar
 *
 * @module rbac
 */

import { relations } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { baseColumns } from "./base.schema";
import { user } from "./auth.schema";

// ═══════════════════════════════════════════════════════════════
// PERFILES
// ═══════════════════════════════════════════════════════════════

/**
 * Perfiles del sistema
 *
 * Los perfiles definen roles flexibles que pueden ser:
 * - Del sistema (isSystem: true): No se pueden eliminar, son esenciales
 * - Por defecto (isDefault: true): Se asignan automáticamente a nuevos registros
 * - Personalizados: Creados por el super admin según necesidades
 *
 * @example
 * // Perfiles del sistema
 * - super_admin: Acceso total al sistema
 * - citizen: Perfil por defecto para ciudadanos registrados
 *
 * @example
 * // Perfiles personalizados (creados por admin)
 * - tesorero: Acceso a módulo financiero
 * - secretario: Acceso a documentos y actas
 */
export const profiles = sqliteTable("profiles", {
  ...baseColumns,
  /** Clave única del perfil (ej: "super_admin", "citizen", "treasurer") */
  key: text("key").notNull().unique(),
  /** Nombre visible del perfil (ej: "Super Administrador") */
  name: text("name").notNull(),
  /** Descripción del propósito del perfil */
  description: text("description"),
  /** Si es true, el perfil es del sistema y no se puede eliminar */
  isSystem: integer("is_system", { mode: "boolean" }).default(false).notNull(),
  /** Si es true, se asigna automáticamente a nuevos registros públicos */
  isDefault: integer("is_default", { mode: "boolean" }).default(false).notNull(),
  /** Si es false, el perfil está desactivado temporalmente */
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  /** Si es true, el perfil se salta todas las validaciones de permisos (bypass total) */
  bypassesRbac: integer("bypasses_rbac", { mode: "boolean" }).default(false).notNull(),
});

export const profilesRelations = relations(profiles, ({ many }) => ({
  permissions: many(profilePermissions),
  users: many(userProfiles),
}));

// ═══════════════════════════════════════════════════════════════
// PERMISOS POR PERFIL
// ═══════════════════════════════════════════════════════════════

/**
 * Permisos granulares asignados a cada perfil
 *
 * Cada registro define qué acción puede realizar un perfil sobre un módulo.
 * La combinación (profileId, module, action) es única.
 *
 * @example
 * // Ejemplo de permisos
 * { profileId: "admin", module: "citizens", action: "create", allowed: true }
 * { profileId: "citizen", module: "requests", action: "create", allowed: true }
 * { profileId: "citizen", module: "users", action: "read", allowed: false }
 */
export const profilePermissions = sqliteTable(
  "profile_permissions",
  {
    ...baseColumns,
    /** ID del perfil al que pertenece este permiso */
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    /** Módulo del sistema (ej: "citizens", "treasury", "polls") */
    module: text("module").notNull(),
    /** Acción permitida (ej: "create", "read", "update", "delete") */
    action: text("action").notNull(),
    /** Si es true, el permiso está activo; si es false, está denegado */
    allowed: integer("allowed", { mode: "boolean" }).default(true).notNull(),
  },
  (table) => [
    // Un perfil solo puede tener un permiso por combinación módulo+acción
    uniqueIndex("profile_module_action_idx").on(
      table.profileId,
      table.module,
      table.action
    ),
  ]
);

export const profilePermissionsRelations = relations(
  profilePermissions,
  ({ one }) => ({
    profile: one(profiles, {
      fields: [profilePermissions.profileId],
      references: [profiles.id],
    }),
  })
);

// ═══════════════════════════════════════════════════════════════
// USUARIO → PERFIL (Relación 1:1)
// ═══════════════════════════════════════════════════════════════

/**
 * Relación entre usuario y perfil
 *
 * Cada usuario tiene EXACTAMENTE un perfil asignado.
 * La columna userId es única para garantizar la relación 1:1.
 *
 * @note
 * El campo `role` en la tabla `user` de better-auth se mantiene
 * para compatibilidad, pero la lógica de permisos usa esta tabla.
 */
export const userProfiles = sqliteTable(
  "user_profiles",
  {
    ...baseColumns,
    /** ID del usuario (único, relación 1:1) */
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
      .unique(),
    /** ID del perfil asignado al usuario */
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
  },
  (table) => [
    // Índice para búsquedas rápidas por usuario
    uniqueIndex("user_profiles_user_id_idx").on(table.userId),
  ]
);

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(user, {
    fields: [userProfiles.userId],
    references: [user.id],
  }),
  profile: one(profiles, {
    fields: [userProfiles.profileId],
    references: [profiles.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════
// AUDITORÍA DE CAMBIOS
// ═══════════════════════════════════════════════════════════════

/**
 * Log de auditoría para cambios sensibles en el sistema RBAC
 *
 * Registra cambios en:
 * - Creación/edición de perfiles
 * - Cambios de permisos
 * - Asignación/cambio de perfiles a usuarios
 *
 * @note
 * Esta tabla es de solo lectura desde la aplicación.
 * Los registros nunca se modifican ni eliminan.
 */
export const auditLogs = sqliteTable("rbac_audit_logs", {
  /** ID único del registro */
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  /** ID del usuario que realizó la acción */
  userId: text("user_id").notNull(),
  /** Tipo de acción realizada */
  action: text("action").notNull(), // "profile_created", "permission_changed", "user_profile_assigned"
  /** Tipo de entidad afectada */
  entityType: text("entity_type"), // "profile", "permission", "user_profile"
  /** ID de la entidad afectada */
  entityId: text("entity_id"),
  /** JSON con los cambios realizados (antes/después) */
  changes: text("changes"),
  /** Fecha y hora del cambio */
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

// ═══════════════════════════════════════════════════════════════
// TIPOS EXPORTADOS
// ═══════════════════════════════════════════════════════════════

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type ProfilePermission = typeof profilePermissions.$inferSelect;
export type NewProfilePermission = typeof profilePermissions.$inferInsert;

export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;