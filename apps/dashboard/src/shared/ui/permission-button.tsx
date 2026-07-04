/**
 * Botón con control de permisos
 *
 * Renderiza un botón solo si el usuario tiene permiso para gestionar
 * el módulo especificado. Modelo simplificado: sin granularidad por acción.
 *
 * @example
 * ```tsx
 * <PermissionButton
 *   module="citizens"
 *   onClick={handleCreate}
 * >
 *   Crear Ciudadano
 * </PermissionButton>
 * ```
 */

import type { VariantProps } from "class-variance-authority";
import type * as React from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { Button, type buttonVariants } from "@/shared/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/shared/ui/tooltip";

type PermissionButtonProps = Omit<React.ComponentProps<"button">, "children"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
		/** Módulo que se quiere gestionar */
		module: string;
		/** Mostrar tooltip si no tiene permisos */
		showTooltip?: boolean;
		/** Mensaje del tooltip */
		tooltipMessage?: string;
		/** Renderizar algo aunque no tenga permisos (ej: botón deshabilitado) */
		renderWithoutPermission?: boolean;
		/** Children */
		children: React.ReactNode;
	};

export function PermissionButton({
	module,
	children,
	showTooltip = true,
	tooltipMessage,
	renderWithoutPermission = false,
	disabled,
	...props
}: PermissionButtonProps) {
	const { canManage, isLoading } = usePermissions();
	const hasPermission = canManage(module);

	// Si está cargando, mostrar botón deshabilitado
	if (isLoading) {
		return (
			<Button disabled {...props}>
				{children}
			</Button>
		);
	}

	// Si no tiene permisos y no debe renderizar
	if (!hasPermission && !renderWithoutPermission) {
		return null;
	}

	// Si no tiene permisos pero debe renderizar (deshabilitado)
	if (!hasPermission && renderWithoutPermission) {
		const button = (
			<Button disabled {...props}>
				{children}
			</Button>
		);

		if (showTooltip) {
			return (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>{button}</TooltipTrigger>
						<TooltipContent>
							<p>{tooltipMessage || "No tienes permisos para esta acción"}</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			);
		}

		return button;
	}

	// Tiene permisos, renderizar normalmente
	return (
		<Button disabled={disabled} {...props}>
			{children}
		</Button>
	);
}

/**
 * Wrapper condicional basado en permisos
 *
 * Renderiza children solo si el usuario puede gestionar el módulo.
 *
 * @example
 * ```tsx
 * <PermissionGuard module="citizens">
 *   <DeleteButton />
 * </PermissionGuard>
 * ```
 */
interface PermissionGuardProps {
	module: string;
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

export function PermissionGuard({
	module,
	children,
	fallback,
}: PermissionGuardProps) {
	const { canManage, isLoading } = usePermissions();

	if (isLoading) return null;

	if (!canManage(module)) {
		return fallback ? fallback : null;
	}

	return <>{children}</>;
}
