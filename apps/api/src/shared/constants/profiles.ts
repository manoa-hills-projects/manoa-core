/**
 * Perfiles del Sistema
 *
 * Define las claves de los perfiles esenciales del sistema.
 * Estos perfiles son protegidos y no se pueden eliminar.
 *
 * @module constants/profiles
 *
 * @example
 * // Verificar si un perfil es del sistema
 * if (profileKey === SYSTEM_PROFILES.SUPER_ADMIN) { ... }
 *
 * @example
 * // Asignar perfil por defecto en registro
 * const defaultProfileKey = SYSTEM_PROFILES.CITIZEN;
 */

export const SYSTEM_PROFILES = {
  /**
   * Super Administrador
   *
   * - Acceso total a todos los módulos y acciones
   * - Puede gestionar perfiles y permisos
   * - No se puede editar ni eliminar
   * - Solo asignado a personal de IT/confianza
   */
  SUPER_ADMIN: "super_admin",

  /**
   * Vecino / Ciudadano
   *
   * - Perfil por defecto para nuevos registros públicos
   * - Acceso limitado a sus propios datos
   * - Puede crear solicitudes, votar, crear tickets
   * - No puede acceder a módulos administrativos
   */
  CITIZEN: "citizen",
} as const;

/**
 * Tipo derivado de las claves de perfiles del sistema
 */
export type SystemProfileKey =
  (typeof SYSTEM_PROFILES)[keyof typeof SYSTEM_PROFILES];

/**
 * Lista de claves de perfiles del sistema
 */
export const SYSTEM_PROFILE_KEYS = Object.values(SYSTEM_PROFILES);

/**
 * Verifica si una clave de perfil es del sistema (protegida)
 *
 * @param key - Clave del perfil a verificar
 * @returns true si el perfil es del sistema y no se puede eliminar
 *
 * @example
 * if (isSystemProfile("super_admin")) {
 *   // No permitir eliminar
 * }
 */
export const isSystemProfile = (key: string): boolean => {
  return (SYSTEM_PROFILE_KEYS as readonly string[]).includes(key);
};

/**
 * Perfiles que no se pueden eliminar (incluye system + otros protegidos)
 *
 * @note
 * El perfil citizen no se puede eliminar porque es el default para registros.
 * En el futuro se pueden agregar más perfiles protegidos aquí.
 */
export const DELETABLE_PROFILES_EXCLUSION = [
  SYSTEM_PROFILES.SUPER_ADMIN,
  SYSTEM_PROFILES.CITIZEN,
] as const;

/**
 * Verifica si un perfil se puede eliminar
 *
 * @param key - Clave del perfil a verificar
 * @returns true si el perfil se puede eliminar
 */
export const isProfileDeletable = (key: string): boolean => {
  return !(DELETABLE_PROFILES_EXCLUSION as readonly string[]).includes(key);
};

/**
 * Clave del perfil que se asigna por defecto a nuevos registros públicos
 */
export const DEFAULT_PROFILE_KEY = SYSTEM_PROFILES.CITIZEN;
