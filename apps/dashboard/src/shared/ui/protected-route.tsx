import { Navigate } from "@tanstack/react-router";
import type * as React from "react";
import { authClient } from "@/lib/auth-client";

interface ProtectedRouteProps {
	permissions?: Record<string, string[]>;
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

export function ProtectedRoute({
	permissions,
	children,
	fallback,
}: ProtectedRouteProps) {
	const { data, isPending } = authClient.useSession();

	if (isPending) {
		return (
			<div className="flex min-h-[50vh] w-full items-center justify-center text-sm text-muted-foreground">
				Verificando accesos...
			</div>
		);
	}

	if (!data?.user) {
		return <Navigate to="/auth" replace />;
	}

	if (permissions) {
		const hasPermission = authClient.admin.checkRolePermission({
			role: (data.user.role as "user" | "admin" | "superadmin") || "user",
			permissions,
		});

		if (!hasPermission) {
			if (fallback !== undefined) return <>{fallback}</>;

			return (
				<div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-2 text-center p-8">
					<h2 className="text-2xl font-bold tracking-tight text-destructive">
						Acceso Denegado
					</h2>
					<p className="text-sm text-muted-foreground max-w-sm">
						No tienes los permisos necesarios para acceder a esta sección o
						realizar esta acción.
					</p>
				</div>
			);
		}
	}

	return <>{children}</>;
}
