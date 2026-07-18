/**
 * Hook para verificar permisos del usuario actual (modelo simplificado RBAC)
 *
 * El modelo simplificado no tiene granularidad por acción: un perfil puede
 * gestionar un módulo o no. `canManage(module)` devuelve `true` si el perfil
 * del usuario tiene el módulo en `profile_permissions` (cualquier fila =
 * acceso) o si el usuario es `super_admin` (short-circuit).
 *
 * Modelo Option C (Mix):
 * - `super_admin`: short-circuit, `canManage` siempre `true`
 * - `citizen`: tiene permisos de VISUALIZACIÓN (houses.view, families.view,
 *   citizens.view, requests.view, polls.view, laws.view, ai.view, stats.view)
 * - Perfiles personalizados: filas en `profile_permissions` según gestión
 *
 * El perfil se obtiene de la ruta exenta `GET /api/profiles/me/profile`
 * (usa `session.user.id` en el backend, no requiere permiso).
 *
 * @example
 * ```tsx
 * const { canManage, isSuperAdmin, profileKey } = usePermissions();
 *
 * if (canManage("citizens")) {
 *   return <Button>Gestionar Ciudadanos</Button>;
 * }
 * ```
 */

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { UserProfile } from "@/entities/profiles/model/types";
import { authClient } from "@/lib/auth-client";
import { api } from "@/shared/api/api-client";

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

export interface UsePermissionsResult {
	/** Verifica si el usuario puede gestionar un módulo (sin granularidad de acción) */
	canManage: (module: string) => boolean;
	/** Clave del perfil del usuario (ej: "super_admin", "citizen") */
	profileKey: string | null;
	/** Nombre del perfil del usuario */
	profileName: string | null;
	/** Si el usuario es Super Administrador (short-circuit en canManage) */
	isSuperAdmin: boolean;
	/** Si el usuario es Ciudadano (perfil por defecto, sin módulos) */
	isCitizen: boolean;
	/** Conjunto de módulos que el perfil puede gestionar */
	managedModules: Set<string>;
	/** Si está cargando los permisos */
	isLoading: boolean;
	/** Si hay error cargando permisos */
	isError: boolean;
}

// ═══════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════

/**
 * Hook principal para verificar permisos (modelo simplificado).
 *
 * Llama a `GET /api/profiles/me/profile` (ruta exenta de permisos) y expone
 * `canManage(module)` basado en el conjunto de módulos del perfil.
 */
export const usePermissions = (): UsePermissionsResult => {
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const userId = session?.user?.id;

	// Obtener perfil del usuario actual (ruta exenta, no requiere permiso)
	const {
		data: userProfile,
		isLoading: isProfileLoading,
		isError,
	} = useQuery({
		queryKey: ["me", "profile"],
		queryFn: () => api.get("profiles/me/profile").json<UserProfile>(),
		enabled: !!userId,
		staleTime: 5 * 60 * 1000, // 5 minutos
	});

	// Conjunto de módulos gestionados por el perfil (sin granularidad de acción)
	const managedModules = useMemo(() => {
		if (!userProfile?.permissions) return new Set<string>();
		return new Set(userProfile.permissions.map((perm) => perm.module));
	}, [userProfile]);

	// canManage(module): true si el perfil tiene bypass o si el módulo está en el perfil
	const canManage = useMemo(() => {
		return (module: string): boolean => {
			if (userProfile?.profile?.bypassesRbac) return true;
			return managedModules.has(module);
		};
	}, [userProfile, managedModules]);

	const isSuperAdmin = userProfile?.profile?.key === "super_admin";
	const isCitizen = userProfile?.profile?.key === "citizen";

	return {
		canManage,
		profileKey: userProfile?.profile?.key ?? null,
		profileName: userProfile?.profile?.name ?? null,
		isSuperAdmin,
		isCitizen,
		managedModules,
		isLoading: isSessionPending || isProfileLoading,
		isError,
	};
};

// ═══════════════════════════════════════════════════════════════
// HOOKS AUXILIARES
// ═══════════════════════════════════════════════════════════════

/**
 * Hook para verificar si el usuario puede gestionar un módulo específico.
 *
 * @example
 * ```tsx
 * const { canManage: canManageCitizens, isLoading } = useCanManage("citizens");
 * ```
 */
export const useCanManage = (module: string) => {
	const { canManage, isLoading } = usePermissions();

	return {
		canManage: canManage(module),
		isLoading,
	};
};
