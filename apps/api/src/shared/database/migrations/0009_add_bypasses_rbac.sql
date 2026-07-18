-- Migración: Agregar columna bypasses_rbac a profiles
-- Permite que un perfil pueda saltarse todas las validaciones de permisos
-- Útil para super_admin y otros perfiles con acceso total

ALTER TABLE profiles ADD COLUMN `bypasses_rbac` integer DEFAULT false NOT NULL;

-- Actualizar el perfil super_admin para que siempre tenga bypass
UPDATE profiles SET bypasses_rbac = 1 WHERE key = 'super_admin';
