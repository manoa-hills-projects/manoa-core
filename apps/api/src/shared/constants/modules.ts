/**
 * Módulos del Sistema
 *
 * Define todos los módulos disponibles en la aplicación.
 * Cada módulo representa un área funcional que puede tener permisos asociados.
 *
 * @module constants/modules
 *
 * @example
 * // Uso en permisos
 * { module: MODULES.CITIZENS, action: ACTIONS.CREATE, allowed: true }
 *
 * @example
 * // Uso en middleware
 * requirePermission(MODULES.TREASURY, ACTIONS.READ)
 */

export const MODULES = {
  // ═══════════════════════════════════════════════════════════════
  // CENSO - Gestión de datos comunitarios
  // ═══════════════════════════════════════════════════════════════
  /** Gestión de viviendas */
  HOUSES: "houses",
  /** Gestión de familias */
  FAMILIES: "families",
  /** Gestión de ciudadanos */
  CITIZENS: "citizens",

  // ═══════════════════════════════════════════════════════════════
  // TRÁMITES - Solicitudes y documentos
  // ═══════════════════════════════════════════════════════════════
  /** Solicitudes de documentos */
  REQUESTS: "requests",
  /** Generación y gestión de documentos */
  DOCUMENTS: "documents",
  /** Firmas y validaciones */
  SIGNATORIES: "signatories",
  /** Validación de documentos */
  VALIDATIONS: "validations",

  // ═══════════════════════════════════════════════════════════════
  // PARTICIPACIÓN - Democracia comunitaria
  // ═══════════════════════════════════════════════════════════════
  /** Votaciones y asambleas */
  POLLS: "polls",
  /** Eventos y calendario */
  EVENTS: "events",

  // ═══════════════════════════════════════════════════════════════
  // FINANZAS - Control económico (NUEVO)
  // ═══════════════════════════════════════════════════════════════
  /** Tesorería y finanzas */
  TREASURY: "treasury",
  /** Pagos y cuotas */
  PAYMENTS: "payments",

  // ═══════════════════════════════════════════════════════════════
  // MANTENIMIENTO - Gestión de incidencias (NUEVO)
  // ═══════════════════════════════════════════════════════════════
  /** Tickets de mantenimiento */
  TICKETS: "tickets",

  // ═══════════════════════════════════════════════════════════════
  // INVENTARIO - Bienes comunales (NUEVO)
  // ═══════════════════════════════════════════════════════════════
  /** Inventario de bienes */
  INVENTORY: "inventory",

  // ═══════════════════════════════════════════════════════════════
  // NORMATIVA - Leyes y regulaciones
  // ═══════════════════════════════════════════════════════════════
  /** Leyes y normativas */
  LAWS: "laws",

  // ═══════════════════════════════════════════════════════════════
  // INTELIGENCIA ARTIFICIAL
  // ═══════════════════════════════════════════════════════════════
  /** Asistente IA */
  AI: "ai",

  // ═══════════════════════════════════════════════════════════════
  // REPORTES - Estadísticas y exportación
  // ═══════════════════════════════════════════════════════════════
  /** Estadísticas del sistema */
  STATS: "stats",
  /** Reportes y exportación */
  REPORTS: "reports",

  // ═══════════════════════════════════════════════════════════════
  // SISTEMA - Administración
  // ═══════════════════════════════════════════════════════════════
  /** Gestión de usuarios */
  USERS: "users",
  /** Gestión de perfiles y permisos */
  PROFILES: "profiles",
  /** Configuración del sistema */
  SETTINGS: "settings",
} as const;

/**
 * Tipo derivado de los módulos disponibles
 */
export type Module = (typeof MODULES)[keyof typeof MODULES];

/**
 * Lista de todos los módulos como array
 * Útil para iteraciones y validaciones
 */
export const MODULE_LIST = Object.values(MODULES) as Module[];

/**
 * Etiquetas legibles para cada módulo (español)
 */
export const MODULE_LABELS: Record<Module, string> = {
  [MODULES.HOUSES]: "Viviendas",
  [MODULES.FAMILIES]: "Familias",
  [MODULES.CITIZENS]: "Ciudadanos",
  [MODULES.REQUESTS]: "Solicitudes",
  [MODULES.DOCUMENTS]: "Documentos",
  [MODULES.SIGNATORIES]: "Firmas",
  [MODULES.VALIDATIONS]: "Validaciones",
  [MODULES.POLLS]: "Votaciones",
  [MODULES.EVENTS]: "Eventos",
  [MODULES.TREASURY]: "Tesorería",
  [MODULES.PAYMENTS]: "Pagos",
  [MODULES.TICKETS]: "Tickets",
  [MODULES.INVENTORY]: "Inventario",
  [MODULES.LAWS]: "Normativas",
  [MODULES.AI]: "Asistente IA",
  [MODULES.STATS]: "Estadísticas",
  [MODULES.REPORTS]: "Reportes",
  [MODULES.USERS]: "Usuarios",
  [MODULES.PROFILES]: "Perfiles",
  [MODULES.SETTINGS]: "Configuración",
};
