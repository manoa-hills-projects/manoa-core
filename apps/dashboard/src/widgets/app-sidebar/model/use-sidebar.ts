/**
 * Hook para la navegación del sidebar
 *
 * Combina la configuración del menú (menu.ts) con los módulos dinámicos
 * de la API, agrupa por categoría y filtra según los permisos del usuario.
 */

import { useMemo } from "react";
import { Circle } from "lucide-react";
import {
	NAV_ITEMS,
	NAV_SECONDARY,
} from "@/entities/navigation/config/menu";
import type { NavigationItems } from "@/entities/navigation/model/types";
import type { Module } from "@/entities/modules";
import { useModules } from "@/entities/modules";
import { usePermissions } from "@/hooks/use-permissions";
import { authClient } from "@/lib/auth-client";
import { ICON_MAP } from "./icon-map";

export interface NavGroup {
	groupLabel: string;
	items: NavigationItems[];
}

/**
 * Resuelve el icono desde el mapa, con fallback a Circle si no existe
 */
function resolveIcon(iconName: string | null | undefined): NavigationItems["icon"] {
	if (iconName && iconName in ICON_MAP) {
		return ICON_MAP[iconName as keyof typeof ICON_MAP];
	}
	return Circle;
}

/**
 * Construye un NavigationItems desde un NavigationConfig + módulo opcional
 */
function resolveNavItem(
	config: (typeof NAV_ITEMS)[number],
	moduleMap: Map<string, Module>,
): NavigationItems | null {
	const mod = moduleMap.get(config.moduleKey);
	if (mod) {
		return {
			title: mod.name,
			url: mod.route || config.url || "/",
			icon: resolveIcon(mod.icon),
			groupLabel: mod.groupLabel,
			permission: config.permission,
		};
	}

	if (config.title || config.url) {
		return {
			title: config.title || config.moduleKey,
			url: config.url || "/",
			icon: resolveIcon(config.moduleKey),
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
 * Agrupa items por groupLabel preservando el orden de aparición
 */
function groupItems(items: NavigationItems[]): NavGroup[] {
	const groups: NavGroup[] = [];
	const seen = new Set<string>();

	for (const item of items) {
		const label = item.groupLabel || "General";
		if (!seen.has(label)) {
			seen.add(label);
			groups.push({ groupLabel: label, items: [] });
		}
		const group = groups.find((g) => g.groupLabel === label);
		if (group) group.items.push(item);
	}

	return groups;
}

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

	// Resolver items principales agrupados
	const navGroups = useMemo(() => {
		const items = NAV_ITEMS.map((item) => resolveNavItem(item, moduleMap))
			.filter((item): item is NavigationItems => item !== null)
			.filter((item) => checkPermission(item.permission, canManage));
		return groupItems(items);
	}, [moduleMap, canManage]);

	// Resolver items secundarios agrupados
	const secondaryGroups = useMemo(() => {
		const items = NAV_SECONDARY.map((item) => resolveNavItem(item, moduleMap))
			.filter((item): item is NavigationItems => item !== null)
			.filter((item) => checkPermission(item.permission, canManage));
		return groupItems(items);
	}, [moduleMap, canManage]);

	return {
		user,
		navGroups,
		secondaryGroups,
		isLoading,
	};
};
