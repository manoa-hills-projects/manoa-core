/**
 * Configuración del menú de navegación
 *
 * Define los items del sidebar con sus permisos asociados.
 * Modelo simplificado: permission = nombre del módulo que el usuario
 * debe poder gestionar (canManage). Si no tiene permission, es visible
 * para todos los autenticados.
 */

import {
	IconCoin,
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
 * `permission` = módulo que el usuario debe poder gestionar (`canManage`) para
 * ver el item en el sidebar. Si se omite, el item es visible para todos los
 * autenticados.
 *
 * Regla: cada item debe declarar el mismo módulo que el `<ProtectedRoute
 * module="X">` de su ruta destino. Sin `permission`, un ciudadano vería el
 * item y tiraría "Acceso denegado" al hacer clic (mala UX).
 *
 * Rutas sin gate (transparencia comunitaria): Dashboard, Asistente IA,
 * Solicitudes (zona 2 filtrada por ownership), Asambleas, Tesorería (zona
 * 1 con `treasury.view` para citizen).
 */
export const NAV_ITEMS: NavigationItems[] = [
	{
		title: "Dashboard",
		url: "/",
		icon: IconDashboard,
	},
	{
		title: "Asistente IA",
		url: "/ai-assistant",
		icon: IconSparkles,
	},
	{
		title: "Viviendas",
		url: "/houses",
		icon: IconHome,
		permission: "houses",
	},
	{
		title: "Familias",
		url: "/families",
		icon: IconUsers,
		permission: "families",
	},
	{
		title: "Ciudadanos",
		url: "/citizens",
		icon: IconUser,
		permission: "citizens",
	},
	{
		title: "Proyectos",
		url: "/polls",
		icon: IconSpeakerphone,
	},
	{
		title: "Tesorería",
		url: "/treasury",
		icon: IconCoin,
		// Zona 1: transparencia visible para todos los autenticados
		// El panel del tesorero (/treasury/manage) tiene su propio ProtectedRoute
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
		permission: "laws",
	},
	{
		title: "Asambleas",
		url: "/meetings",
		icon: IconVideo,
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
