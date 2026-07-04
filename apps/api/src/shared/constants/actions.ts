/**
 * Acciones del Sistema (DEPRECATED)
 *
 * @deprecated El sistema RBAC simplificado ya no usa granularidad por acción.
 * El middleware requirePermission(module) solo verifica acceso al módulo,
 * sin distinguir acciones. Este archivo se mantiene solo para compatibilidad
 * con el schema de BD (la columna action existe pero no se evalúa).
 *
 * NO usar ACTIONS para verificaciones de permisos. Usar requirePermission(module)
 * en backend y canManage(module) en frontend.
 *
 * @module constants/actions
 */

export const ACTIONS = {
  // ═══════════════════════════════════════════════════════════════
  // ACCIÓN ACL SIMPLIFICADA
  // ═══════════════════════════════════════════════════════════════
  /** Ver/acceder a un módulo (ACL simplificado) */
  VIEW: "view",

  // ═══════════════════════════════════════════════════════════════
  // ACCIONES CRUD BÁSICAS
  // ═══════════════════════════════════════════════════════════════
  /** Crear nuevos registros */
  CREATE: "create",
  /** Leer/ver registros */
  READ: "read",
  /** Actualizar registros existentes */
  UPDATE: "update",
  /** Eliminar registros */
  DELETE: "delete",

  // ═══════════════════════════════════════════════════════════════
  // ACCIONES DE DATOS
  // ═══════════════════════════════════════════════════════════════
  /** Exportar datos (CSV, PDF, etc.) */
  EXPORT: "export",
  /** Importar datos (CSV, etc.) */
  IMPORT: "import",

  // ═══════════════════════════════════════════════════════════════
  // ACCIONES ESPECÍFICAS DE FLUJO
  // ═══════════════════════════════════════════════════════════════
  /** Aprobar solicitudes, documentos, etc. */
  APPROVE: "approve",
  /** Rechazar solicitudes, documentos, etc. */
  REJECT: "reject",
  /** Revisar/auditar (sin aprobar/rechazar) */
  REVIEW: "review",

  // ═══════════════════════════════════════════════════════════════
  // ACCIONES DE PARTICIPACIÓN
  // ═══════════════════════════════════════════════════════════════
  /** Votar en asambleas/votaciones */
  VOTE: "vote",
  /** Asignar responsables (tickets, tareas, etc.) */
  ASSIGN: "assign",

  // ═══════════════════════════════════════════════════════════════
  // ACCIONES DE ADMINISTRACIÓN
  // ═══════════════════════════════════════════════════════════════
  /** Gestionar/configurar el módulo */
  MANAGE: "manage",
  /** Publicar/hacer visible (eventos, noticias, etc.) */
  PUBLISH: "publish",
} as const;

/**
 * Tipo derivado de las acciones disponibles
 */
export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];

/**
 * Lista de todas las acciones como array
 * Útil para iteraciones y validaciones
 */
export const ACTION_LIST = Object.values(ACTIONS) as Action[];

/**
 * Etiquetas legibles para cada acción (español)
 */
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
 * Descripción de qué permite cada acción
 */
export const ACTION_DESCRIPTIONS: Record<Action, string> = {
  [ACTIONS.VIEW]: "Ver y acceder al módulo",
  [ACTIONS.CREATE]: "Crear nuevos registros en el módulo",
  [ACTIONS.READ]: "Ver y consultar registros del módulo",
  [ACTIONS.UPDATE]: "Modificar registros existentes",
  [ACTIONS.DELETE]: "Eliminar registros del módulo",
  [ACTIONS.EXPORT]: "Descargar datos en formatos CSV, PDF, etc.",
  [ACTIONS.IMPORT]: "Cargar datos masivamente desde archivos",
  [ACTIONS.APPROVE]: "Aprobar solicitudes o documentos pendientes",
  [ACTIONS.REJECT]: "Rechazar solicitudes o documentos",
  [ACTIONS.REVIEW]: "Revisar sin tomar acción definitiva",
  [ACTIONS.VOTE]: "Emitir voto en votaciones/asambleas",
  [ACTIONS.ASSIGN]: "Asignar responsables a tickets o tareas",
  [ACTIONS.MANAGE]: "Configuración avanzada del módulo",
  [ACTIONS.PUBLISH]: "Hacer visible contenido al público",
};
