/**
 * Componente para proteger rutas basado en el modelo RBAC simplificado.
 *
 * El modelo define 3 zonas por módulo:
 * - Zona 1 (Transparencia): solo requiere autenticación.
 * - Zona 2 (Mis datos): solo requiere autenticación.
 * - Zona 3 (Administración): requiere `canManage(module)`.
 *
 * Uso:
 * - Para rutas admin (Zona 3): `<ProtectedRoute module="citizens">`.
 * - Para rutas de comunidad (Zonas 1/2): `<ProtectedRoute>` sin `module`.
 *
 * @example
 * ```tsx
 * // Ruta admin (Zona 3): requiere canManage("citizens")
 * <ProtectedRoute module="citizens">
 *   <CitizensAdmin />
 * </ProtectedRoute>
 * ```
 *
 * @example
 * ```tsx
 * // Ruta de comunidad (Zonas 1/2): solo requiere autenticación
 * <ProtectedRoute>
 *   <PublicPolls />
 * </ProtectedRoute>
 * ```
 */

import { IconShieldOff } from "@tabler/icons-react";
import { Navigate } from "@tanstack/react-router";
import type * as React from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { authClient } from "@/lib/auth-client";

interface ProtectedRouteProps {
	/**
	 * Módulo cuya Zona 3 (admin) se quiere proteger.
	 * Si se omite, la ruta solo requiere autenticación (Zonas 1/2).
	 */
	module?: string;
	/** Contenido a renderizar si el usuario está autorizado */
	children: React.ReactNode;
	/** Contenido alternativo si el usuario no tiene permiso (Zona 3) */
	fallback?: React.ReactNode;
}

/**
 * Protege una ruta verificando autenticación y, opcionalmente, `canManage(module)`.
 *
 * - Si no está autenticado → redirige a `/auth`.
 * - Si la sesión (o los permisos, para rutas admin) están cargando → muestra estado de carga.
 * - Si `module` está presente y `canManage(module)` es false → muestra `fallback` o `<AccessDenied />`.
 * - En caso contrario → renderiza `children`.
 */
export function ProtectedRoute({
	module,
	children,
	fallback,
}: ProtectedRouteProps) {
	const { data, isPending: isSessionLoading } = authClient.useSession();
	const { canManage, isLoading: isPermissionsLoading } = usePermissions();

	// Las rutas de comunidad (sin `module`) solo necesitan auth;
	// las rutas admin (con `module`) además necesitan los permisos cargados.
	const isLoading =
		isSessionLoading || (module !== undefined && isPermissionsLoading);

	// Loading state
	if (isLoading) {
		return (
			<div className="flex min-h-[50vh] w-full items-center justify-center text-sm text-muted-foreground">
				Cargando sesión...
			</div>
		);
	}

	// No autenticado
	if (!data?.user) {
		return <Navigate to="/auth" replace />;
	}

	// Ruta admin (Zona 3): verificar canManage(module)
	if (module !== undefined && !canManage(module)) {
		if (fallback !== undefined) return <>{fallback}</>;

		return <AccessDenied />;
	}

	// Ruta de comunidad (Zonas 1/2) o ruta admin autorizada
	return <>{children}</>;
}

/**
 * Componente de acceso denegado
 */
function AccessDenied() {
	return (
		<div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 text-center p-8">
			<div className="rounded-full bg-destructive/10 p-4">
				<IconShieldOff className="h-8 w-8 text-destructive" />
			</div>
			<div className="space-y-2">
				<h2 className="text-2xl font-bold tracking-tight">Acceso Denegado</h2>
				<p className="text-sm text-muted-foreground max-w-sm">
					No tienes los permisos necesarios para acceder a esta sección o
					realizar esta acción.
				</p>
			</div>
		</div>
	);
}

/**
 * Hook para verificar si el usuario puede gestionar un módulo (Zona 3).
 *
 * Envuelve `canManage` de `usePermissions` para uso puntual en componentes.
 *
 * @example
 * ```tsx
 * function DeleteButton() {
 *   const { canManage, isLoading } = useCanManage("citizens");
 *
 *   if (isLoading) return <Skeleton />;
 *   if (!canManage) return null;
 *
 *   return <Button>Eliminar</Button>;
 * }
 * ```
 */
export function useCanManage(module: string) {
	const { canManage, isLoading } = usePermissions();

	return {
		canManage: canManage(module),
		isLoading,
	};
}
