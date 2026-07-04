/**
 * Configuración del menú de navegación
 *
 * Define los items del sidebar con sus permisos asociados.
 * Modelo simplificado: permission = nombre del módulo que el usuario
 * debe poder gestionar (canManage). Si no tiene permission, es visible
 * para todos los autenticados.
 */

import {
	IconDashboard,
	IconFileDescription,
	IconFileText,
	IconHome,
	IconSettings,
	IconShieldCheck,
	IconShieldLock,
	IconSparkles,
	IconSpeakerphone,
	IconUser,
	IconUsers,
	IconVideo,
} from "@tabler/icons-react";
import type { NavigationItems } from "../model/types";

/**
 * Items principales del menú
 *
 * permission = módulo requerido para ver el item en el sidebar.
 * Si se omite, el item es visible para todos los autenticados.
 *
 * Modelo de 3 zonas:
 * - Zona 1 (transparencia): houses, families, citizens, laws, polls, stats → visible para todos
 * - Zona 2 (mis datos): filtered by ownership
 * - Zona 3 (admin): requirePermission
 *
 * Para simplificar, solo las rutas de ZONA 3 (gestión) requieren permission.
 * Las rutas de zona 1 (transparencia) no requieren permission.
 */
export const NAV_ITEMS: NavigationItems[] = [
	{
		title: "Dashboard",
		url: "/",
		icon: IconDashboard,
		// Dashboard siempre visible para todos los autenticados
	},
	{
		title: "Asistente IA",
		url: "/ai-assistant",
		icon: IconSparkles,
		// IA es comunidad: visible para todos los autenticados
	},
	{
		title: "Viviendas",
		url: "/houses",
		icon: IconHome,
		// Zona 1: visible para todos los autenticados (transparencia)
		// La gestión (zona 3) requiere permission, pero ver es libre
	},
	{
		title: "Familias",
		url: "/families",
		icon: IconUsers,
		// Zona 1: visible para todos los autenticados
	},
	{
		title: "Ciudadanos",
		url: "/citizens",
		icon: IconUser,
		// Zona 1: visible para todos los autenticados
	},
	{
		title: "Proyectos",
		url: "/polls",
		icon: IconSpeakerphone,
		// Polls es comunidad: visible para todos los autenticados
	},
	{
		title: "Solicitudes",
		url: "/requests",
		icon: IconFileDescription,
		// Requests es zona 2 (mis datos): visible para todos pero filtra
	},
	{
		title: "Leyes",
		url: "/laws",
		icon: IconFileText,
		// Laws es zona 1: visible para todos los autenticados
	},
	{
		title: "Asambleas",
		url: "/meetings",
		icon: IconVideo,
		// Asambleas es comunidad: visible para todos los autenticados
	},
];

/**
 * Items secundarios del menú (administración)
 */
export const NAV_SECONDARY: NavigationItems[] = [
	{
		title: "Usuarios",
		url: "/users",
		icon: IconUsers,
		permission: "users",
	},
	{
		title: "Perfiles",
		url: "/profiles",
		icon: IconShieldLock,
		permission: "profiles",
	},
	{
		title: "Validaciones",
		url: "/validations",
		icon: IconShieldCheck,
		// Validaciones es comunidad: visible para todos los autenticados
	},
	{
		title: "Configuración",
		url: "/settings",
		icon: IconSettings,
		permission: "settings",
	},
];
