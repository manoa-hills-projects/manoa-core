-- Migración: Sistema RBAC con perfiles y permisos
-- Crea las tablas necesarias para el control de acceso basado en perfiles

-- Tabla de perfiles
CREATE TABLE IF NOT EXISTS `profiles` (
    `id` text PRIMARY KEY NOT NULL,
    `key` text NOT NULL UNIQUE,
    `name` text NOT NULL,
    `description` text,
    `is_system` integer DEFAULT false NOT NULL,
    `is_default` integer DEFAULT false NOT NULL,
    `is_active` integer DEFAULT true NOT NULL,
    `created_at` integer DEFAULT (unixepoch()) NOT NULL,
    `updated_at` integer DEFAULT (unixepoch())
);

-- Tabla de permisos por perfil
CREATE TABLE IF NOT EXISTS `profile_permissions` (
    `id` text PRIMARY KEY NOT NULL,
    `profile_id` text NOT NULL REFERENCES `profiles`(`id`) ON DELETE CASCADE,
    `module` text NOT NULL,
    `action` text NOT NULL,
    `allowed` integer DEFAULT true NOT NULL,
    `created_at` integer DEFAULT (unixepoch()) NOT NULL,
    `updated_at` integer DEFAULT (unixepoch())
);

-- Índice único para evitar permisos duplicados
CREATE UNIQUE INDEX IF NOT EXISTS `profile_module_action_idx` ON `profile_permissions`(`profile_id`, `module`, `action`);

-- Tabla de relación usuario-perfil (1:1)
CREATE TABLE IF NOT EXISTS `user_profiles` (
    `id` text PRIMARY KEY NOT NULL,
    `user_id` text NOT NULL UNIQUE REFERENCES `user`(`id`) ON DELETE CASCADE,
    `profile_id` text NOT NULL REFERENCES `profiles`(`id`) ON DELETE RESTRICT,
    `created_at` integer DEFAULT (unixepoch()) NOT NULL,
    `updated_at` integer DEFAULT (unixepoch())
);

-- Índice para búsquedas rápidas por usuario
CREATE UNIQUE INDEX IF NOT EXISTS `user_profiles_user_id_idx` ON `user_profiles`(`user_id`);

-- Tabla de auditoría de cambios RBAC
CREATE TABLE IF NOT EXISTS `rbac_audit_logs` (
    `id` text PRIMARY KEY NOT NULL,
    `user_id` text NOT NULL,
    `action` text NOT NULL,
    `entity_type` text,
    `entity_id` text,
    `changes` text,
    `created_at` integer DEFAULT (unixepoch()) NOT NULL
);
