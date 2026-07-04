/**
 * Hook para la navegación del sidebar
 *
 * Filtra los items del menú según los permisos del usuario
 * usando el sistema RBAC simplificado (canManage).
 */

import { useMemo } from "react";
import { NAV_ITEMS, NAV_SECONDARY } from "@/entities/navigation/config/menu";
import type { NavigationItems } from "@/entities/navigation/model/types";
import { usePermissions } from "@/hooks/use-permissions";
import { authClient } from "@/lib/auth-client";

/**
 * Verifica si el usuario tiene permisos para ver un item del menú
 *
 * Si el item no tiene permission definido, es visible para todos.
 * Si tiene permission, el usuario debe poder gestionar ese módulo.
 */
const checkPermission = (
	permission: string | undefined,
	canManage: (module: string) => boolean,
): boolean => {
	if (!permission) return true;
	return canManage(permission);
};

/**
 * Filtra los items del menú según los permisos del usuario
 */
const getFilteredMenu = (
	items: typeof NAV_ITEMS,
	canManage: (module: string) => boolean,
): NavigationItems[] => {
	return items.filter((item) => checkPermission(item.permission, canManage));
};

/**
 * Hook principal para la navegación del sidebar
 */
export const useSidebarNav = () => {
	const { data: session, isPending: isSessionLoading } =
		authClient.useSession();
	const { canManage, isLoading: isPermissionsLoading } = usePermissions();

	const user = session?.user;
	const isLoading = isSessionLoading || isPermissionsLoading;

	const filteredNav = useMemo(
		() => getFilteredMenu(NAV_ITEMS, canManage),
		[canManage],
	);

	const filteredSecondary = useMemo(
		() => getFilteredMenu(NAV_SECONDARY, canManage),
		[canManage],
	);

	return {
		user,
		navItems: filteredNav,
		secondaryItems: filteredSecondary,
		isLoading,
	};
};
