/**
 * Constantes del sistema RBAC para el frontend
 *
 * Los módulos ahora vienen de la DB (GET /api/modules).
 * Este archivo solo mantiene compatibilidad con código legacy.
 */

// ═══════════════════════════════════════════════════════════════
// MÓDULOS (legacy - los datos reales vienen de GET /api/modules)
// ═══════════════════════════════════════════════════════════════

export const MODULES = {
  HOUSES: "houses",
  FAMILIES: "families",
  CITIZENS: "citizens",
  REQUESTS: "requests",
  DOCUMENTS: "documents",
  SIGNATORIES: "signatories",
  VALIDATIONS: "validations",
  POLLS: "polls",
  EVENTS: "events",
  TREASURY: "treasury",
  PAYMENTS: "payments",
  TICKETS: "tickets",
  INVENTORY: "inventory",
  LAWS: "laws",
  AI: "ai",
  STATS: "stats",
  REPORTS: "reports",
  USERS: "users",
  PROFILES: "profiles",
  SETTINGS: "settings",
} as const;

export type Module = (typeof MODULES)[keyof typeof MODULES];

// ═══════════════════════════════════════════════════════════════
// ACCIONES
// ═══════════════════════════════════════════════════════════════

export const ACTIONS = {
  VIEW: "view",
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
  EXPORT: "export",
  IMPORT: "import",
  APPROVE: "approve",
  REJECT: "reject",
  REVIEW: "review",
  VOTE: "vote",
  ASSIGN: "assign",
  MANAGE: "manage",
  PUBLISH: "publish",
} as const;

export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];

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
