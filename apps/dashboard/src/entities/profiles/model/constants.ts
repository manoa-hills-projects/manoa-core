/**
 * Constantes del sistema RBAC para el frontend
 *
 * Estas constantes deben mantenerse sincronizadas con las del backend.
 */

// ═══════════════════════════════════════════════════════════════
// MÓDULOS
// ═══════════════════════════════════════════════════════════════

export const MODULES = {
  // Censo
  HOUSES: "houses",
  FAMILIES: "families",
  CITIZENS: "citizens",

  // Trámites
  REQUESTS: "requests",
  DOCUMENTS: "documents",
  SIGNATORIES: "signatories",
  VALIDATIONS: "validations",

  // Participación
  POLLS: "polls",
  EVENTS: "events",

  // Finanzas (NUEVO)
  TREASURY: "treasury",
  PAYMENTS: "payments",

  // Mantenimiento (NUEVO)
  TICKETS: "tickets",

  // Inventario (NUEVO)
  INVENTORY: "inventory",

  // Normativa
  LAWS: "laws",

  // IA
  AI: "ai",

  // Reportes
  STATS: "stats",
  REPORTS: "reports",

  // Sistema
  USERS: "users",
  PROFILES: "profiles",
  SETTINGS: "settings",
} as const;

export type Module = (typeof MODULES)[keyof typeof MODULES];

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

/**
 * Módulos agrupados por categoría para la UI
 */
export const MODULE_GROUPS = {
  census: {
    label: "Censo",
    modules: [MODULES.HOUSES, MODULES.FAMILIES, MODULES.CITIZENS],
  },
  requests: {
    label: "Trámites",
    modules: [
      MODULES.REQUESTS,
      MODULES.DOCUMENTS,
      MODULES.SIGNATORIES,
      MODULES.VALIDATIONS,
    ],
  },
  participation: {
    label: "Participación",
    modules: [MODULES.POLLS, MODULES.EVENTS],
  },
  finance: {
    label: "Finanzas",
    modules: [MODULES.TREASURY, MODULES.PAYMENTS],
  },
  maintenance: {
    label: "Mantenimiento",
    modules: [MODULES.TICKETS],
  },
  inventory: {
    label: "Inventario",
    modules: [MODULES.INVENTORY],
  },
  system: {
    label: "Sistema",
    modules: [
      MODULES.LAWS,
      MODULES.AI,
      MODULES.STATS,
      MODULES.REPORTS,
      MODULES.USERS,
      MODULES.PROFILES,
      MODULES.SETTINGS,
    ],
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// ACCIONES
// ═══════════════════════════════════════════════════════════════

export const ACTIONS = {
  // ACL simplificado
  VIEW: "view",

  // CRUD básico
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",

  // Datos
  EXPORT: "export",
  IMPORT: "import",

  // Flujo
  APPROVE: "approve",
  REJECT: "reject",
  REVIEW: "review",

  // Participación
  VOTE: "vote",
  ASSIGN: "assign",

  // Administración
  MANAGE: "manage",
  PUBLISH: "publish",
} as const;

export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];

export const ACTION_LABELS: Record<Action, string> = {
  [ACTIONS.VIEW]: "Ver",
  [ACTIONS.CREATE]: "Crear",
  [ACTIONS.READ]: "Ver",
  [ACTIONS.UPDATE]: "Editar",
  [ACTIONS.DELETE]: "Eliminar",
  [ACTIONS.EXPORT]: "Exportar",
  [ACTIONS.IMPORT]: "Importar",
  [ACTIONS.APPROVE]: "Aprobar",
  [ACTIONS.REJECT]: "Rechazar",
  [ACTIONS.REVIEW]: "Revisar",
  [ACTIONS.VOTE]: "Votar",
  [ACTIONS.ASSIGN]: "Asignar",
  [ACTIONS.MANAGE]: "Gestionar",
  [ACTIONS.PUBLISH]: "Publicar",
};

/**
 * Acciones comunes para mostrar en la matriz de permisos
 */
export const COMMON_ACTIONS = [
  ACTIONS.CREATE,
  ACTIONS.READ,
  ACTIONS.UPDATE,
  ACTIONS.DELETE,
  ACTIONS.EXPORT,
] as const;

/**
 * Todas las acciones disponibles
 */
export const ALL_ACTIONS = Object.values(ACTIONS) as Action[];

// ═══════════════════════════════════════════════════════════════
// PERFILES DEL SISTEMA
// ═══════════════════════════════════════════════════════════════

export const SYSTEM_PROFILES = {
  SUPER_ADMIN: "super_admin",
  CITIZEN: "citizen",
} as const;

export const isSystemProfile = (key: string): boolean => {
  return Object.values(SYSTEM_PROFILES).includes(key as any);
};
