/**
 * Hook para la navegación del sidebar
 *
 * Combina la configuración del menú (menu.ts) con los módulos dinámicos
 * de la API, y filtra según los permisos del usuario.
 */

import { useMemo } from "react";
import {
	NAV_ITEMS,
	NAV_SECONDARY,
} from "@/entities/navigation/config/menu";
import type { NavigationItems } from "@/entities/navigation/model/types";
import { useModules } from "@/entities/modules";
import { usePermissions } from "@/hooks/use-permissions";
import { authClient } from "@/lib/auth-client";
import { ICON_MAP } from "./icon-map";

/**
 * Construye un NavigationItems desde un NavigationConfig + módulo opcional
 */
function resolveNavItem(
	config: (typeof NAV_ITEMS)[number],
	moduleMap: Map<string, (typeof NAV_ITEMS)[number]>,
): NavigationItems | null {
	// Si el módulo existe en la DB, usar sus datos
	const module = moduleMap.get(config.moduleKey);
	if (module) {
		return {
			title: module.name,
			url: module.route || config.url || "/",
			icon: ICON_MAP[module.icon as keyof typeof ICON_MAP],
			permission: config.permission,
		};
	}

	// Si no está en DB pero tiene title/url hardcoded, usarlos
	if (config.title || config.url) {
		return {
			title: config.title || config.moduleKey,
			url: config.url || "/",
			icon: ICON_MAP[config.moduleKey as keyof typeof ICON_MAP],
			permission: config.permission,
		};
	}

	return null;
}

/**
 * Verifica si el usuario tiene permisos para ver un item del menú
 */
const checkPermission = (
	permission: string | undefined,
	canManage: (module: string) => boolean,
): boolean => {
	if (!permission) return true;
	return canManage(permission);
};

/**
 * Hook principal para la navegación del sidebar
 */
export const useSidebarNav = () => {
	const { data: session, isPending: isSessionLoading } =
		authClient.useSession();
	const { canManage, isLoading: isPermissionsLoading } = usePermissions();
	const { modules, isLoading: isModulesLoading } = useModules();

	const user = session?.user;
	const isLoading = isSessionLoading || isPermissionsLoading || isModulesLoading;

	// Mapa de moduleKey → módulo para lookup rápido
	const moduleMap = useMemo(() => {
		const map = new Map<string, (typeof modules)[number]>();
		for (const mod of modules) {
			map.set(mod.key, mod);
		}
		return map;
	}, [modules]);

	// Resolver items principales
	const filteredNav = useMemo(() => {
		return NAV_ITEMS.map((item) => resolveNavItem(item, moduleMap))
			.filter((item): item is NavigationItems => item !== null)
			.filter((item) => checkPermission(item.permission, canManage));
	}, [moduleMap, canManage]);

	// Resolver items secundarios
	const filteredSecondary = useMemo(() => {
		return NAV_SECONDARY.map((item) => resolveNavItem(item, moduleMap))
			.filter((item): item is NavigationItems => item !== null)
			.filter((item) => checkPermission(item.permission, canManage));
	}, [moduleMap, canManage]);

	return {
		user,
		navItems: filteredNav,
		secondaryItems: filteredSecondary,
		isLoading,
	};
};
