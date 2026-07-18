/**
 * Configuración del menú de navegación
 *
 * Define qué módulos aparecen en el sidebar y su orden.
 * Los datos reales (nombre, icono, ruta) vienen de GET /api/modules.
 *
 * `moduleKey` = key del módulo en la DB (para filtrar por permisos)
 * Si no tiene moduleKey, es un item público (sin gate de permisos)
 */

import type { NavigationConfig } from "../model/types";

/**
 * Items principales del menú
 */
export const NAV_ITEMS: NavigationConfig[] = [
	// Items públicos (sin moduleKey, siempre visibles para autenticados)
	{ moduleKey: "dashboard", title: "Dashboard", url: "/" },
	{ moduleKey: "ai", title: "Asistente IA", url: "/ai-assistant" },
	{ moduleKey: "polls", title: "Proyectos", url: "/polls" },
	{ moduleKey: "treasury", title: "Tesorería", url: "/treasury" },
	{ moduleKey: "requests", title: "Solicitudes", url: "/requests" },
	{ moduleKey: "events", title: "Asambleas", url: "/meetings" },

	// Items con permiso (filtrados por canManage)
	{ moduleKey: "houses", permission: "houses" },
	{ moduleKey: "families", permission: "families" },
	{ moduleKey: "citizens", permission: "citizens" },
	{ moduleKey: "laws", permission: "laws" },
	{ moduleKey: "tickets", permission: "tickets" },
];

/**
 * Items secundarios del menú (administración)
 */
export const NAV_SECONDARY: NavigationConfig[] = [
	{ moduleKey: "validations", title: "Validaciones", url: "/validations" },
	{ moduleKey: "acts", title: "Libro de Actas", url: "/acts" },
	{ moduleKey: "tickets", title: "Reportes", url: "/tickets" },
	{ moduleKey: "users", permission: "users" },
	{ moduleKey: "profiles", permission: "profiles" },
	{ moduleKey: "settings", permission: "settings" },
];
