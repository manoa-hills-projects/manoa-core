/**
 * Sistema de Control de Acceso (Legacy / Transición)
 *
 * @deprecated Este archivo mantiene compatibilidad con el sistema anterior
 * de better-auth/plugins/access. El nuevo sistema RBAC basado en perfiles
 * está en ./permissions.middleware.ts
 *
 * Durante la transición, este archivo define los roles básicos para
 * el plugin admin de better-auth, pero la lógica de permisos real
 * se maneja con el middleware requirePermission() que consulta la BD.
 *
 * @module utils/permissions
 *
 * @see {@link ./permissions.middleware.ts} - Nuevo sistema RBAC
 * @see {@link ../constants/modules.ts} - Módulos del sistema
 * @see {@link ../constants/actions.ts} - Acciones disponibles
 */

import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

/**
 * Statement de permisos para better-auth
 *
 * @deprecated Usar MODULES y ACTIONS de ../constants en su lugar
 */
export const statement = {
  ...defaultStatements,
  // Módulos legacy - mantener para compatibilidad
  project: ["create", "update", "delete", "vote", "read"],
  document: ["create", "read", "delete"],
  census: ["create", "read", "update", "delete"],
  houses: ["read"],
  families: ["read"],
  citizens: ["read"],
} as const;

export const ac = createAccessControl(statement);

/**
 * Rol de usuario básico (legacy)
 * @deprecated Usar perfil "citizen" del nuevo sistema RBAC
 */
export const user = ac.newRole({
  project: ["read", "vote"],
  document: ["read"],
  houses: ["read"],
  families: ["read"],
  citizens: ["read"],
});

/**
 * Rol de administrador (legacy)
 * @deprecated Usar perfil "super_admin" del nuevo sistema RBAC
 */
export const admin = ac.newRole({
  ...adminAc.statements,
  project: ["create", "update", "delete", "read", "vote"],
  document: ["create", "read", "delete"],
  census: ["create", "read", "update", "delete"],
  houses: ["read"],
  families: ["read"],
  citizens: ["read"],
});

/**
 * Rol de super administrador (legacy)
 * @deprecated Usar perfil "super_admin" del nuevo sistema RBAC
 */
export const superadmin = ac.newRole({
  ...adminAc.statements,
  user: ["impersonate", ...(adminAc.statements.user || [])],
  project: ["create", "update", "delete", "read", "vote"],
  document: ["create", "read", "delete"],
  census: ["create", "read", "update", "delete"],
  houses: ["read"],
  families: ["read"],
  citizens: ["read"],
});
