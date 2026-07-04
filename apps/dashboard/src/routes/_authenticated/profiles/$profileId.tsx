/**
 * Página de detalle de perfil - Editor de permisos (ACL simplificado)
 *
 * Permite ver y editar qué módulos puede ver cada perfil.
 * Sistema simplificado: solo control de acceso a vistas (view).
 */

import {
	IconArrowLeft,
	IconCheck,
	IconLock,
	IconShield,
} from "@tabler/icons-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Module } from "@/entities/profiles";
import {
	MODULE_GROUPS,
	MODULE_LABELS,
	useProfile,
	useUpdatePermissions,
} from "@/entities/profiles";
import { usePermissions } from "@/hooks/use-permissions";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { ProtectedRoute } from "@/shared/ui/protected-route";
import { Separator } from "@/shared/ui/separator";
import { Skeleton } from "@/shared/ui/skeleton";

export const Route = createFileRoute("/_authenticated/profiles/$profileId")({
	component: ProfileDetailPage,
});

function ProfileDetailPage() {
	return (
		<ProtectedRoute module="profiles">
			<ProfileDetailContent />
		</ProtectedRoute>
	);
}

function ProfileDetailContent() {
	const { profileId } = Route.useParams();
	const navigate = useNavigate();
	const { isSuperAdmin } = usePermissions();
	const { data: profile, isLoading } = useProfile(profileId);
	const updatePermissions = useUpdatePermissions();

	// Estado local para los módulos permitidos
	const [allowedModules, setAllowedModules] = useState<Set<string>>(new Set());
	const [hasChanges, setHasChanges] = useState(false);

	// Inicializar módulos permitidos desde el perfil
	useEffect(() => {
		if (profile?.permissions) {
			const modules = new Set<string>();
			for (const perm of profile.permissions) {
				if (perm.allowed && perm.action === "view") {
					modules.add(perm.module);
				}
			}
			setAllowedModules(modules);
		}
	}, [profile]);

	// Verificar si hay cambios
	useEffect(() => {
		if (!profile?.permissions) return;

		const currentModules = new Set(
			profile.permissions
				.filter((p) => p.allowed && p.action === "view")
				.map((p) => p.module),
		);

		const hasDiff =
			currentModules.size !== allowedModules.size ||
			[...currentModules].some((m) => !allowedModules.has(m));

		setHasChanges(hasDiff);
	}, [allowedModules, profile]);

	// Toggle módulo
	const toggleModule = (module: string) => {
		setAllowedModules((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(module)) {
				newSet.delete(module);
			} else {
				newSet.add(module);
			}
			return newSet;
		});
	};

	// Toggle todos los módulos de un grupo
	const toggleGroup = (modules: string[], checked: boolean) => {
		setAllowedModules((prev) => {
			const newSet = new Set(prev);
			for (const module of modules) {
				if (checked) {
					newSet.add(module);
				} else {
					newSet.delete(module);
				}
			}
			return newSet;
		});
	};

	// Guardar permisos
	const handleSave = async () => {
		const permissionsArray = Array.from(allowedModules).map((module) => ({
			module,
			action: "view",
			allowed: true,
		}));

		try {
			await updatePermissions.mutateAsync({
				id: profileId,
				data: { permissions: permissionsArray },
			});
			toast.success("Permisos actualizados correctamente");
			setHasChanges(false);
		} catch (error: any) {
			toast.error(error?.message || "Error al actualizar permisos");
		}
	};

	if (isLoading) {
		return (
			<div className="p-6 space-y-4">
				<Skeleton className="h-10 w-64" />
				<Skeleton className="h-96" />
			</div>
		);
	}

	if (!profile) {
		return (
			<div className="p-6">
				<p className="text-destructive">Perfil no encontrado</p>
				<Button
					variant="outline"
					className="mt-4"
					onClick={() => navigate({ to: "/profiles" })}
				>
					Volver a perfiles
				</Button>
			</div>
		);
	}

	const isSystemProfile = profile.key === "super_admin";

	return (
		<div className="p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => navigate({ to: "/profiles" })}
				>
					<IconArrowLeft className="h-5 w-5" />
				</Button>
				<div className="flex-1">
					<div className="flex items-center gap-2">
						<h1 className="text-2xl font-bold tracking-tight">
							{profile.name}
						</h1>
						{profile.isSystem && (
							<Badge variant="outline" className="gap-1">
								<IconLock className="h-3 w-3" />
								Sistema
							</Badge>
						)}
					</div>
					{profile.description && (
						<p className="text-muted-foreground mt-1">{profile.description}</p>
					)}
				</div>
				{hasChanges && isSuperAdmin && !isSystemProfile && (
					<Button onClick={handleSave} disabled={updatePermissions.isPending}>
						<IconCheck className="h-4 w-4 mr-2" />
						{updatePermissions.isPending ? "Guardando..." : "Guardar Cambios"}
					</Button>
				)}
			</div>

			{/* Advertencia para super_admin */}
			{isSystemProfile && (
				<div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
					<p className="text-sm text-yellow-800 dark:text-yellow-200">
						<IconShield className="h-4 w-4 inline mr-2" />
						Los permisos del Super Administrador no se pueden modificar. Tiene
						acceso a todos los módulos.
					</p>
				</div>
			)}

			{/* Lista de módulos */}
			<Card>
				<CardHeader>
					<CardTitle>Módulos Visibles</CardTitle>
					<p className="text-sm text-muted-foreground">
						Selecciona qué módulos puede ver este perfil
					</p>
				</CardHeader>
				<CardContent>
					<ModulesList
						allowedModules={allowedModules}
						onToggle={toggleModule}
						onToggleGroup={toggleGroup}
						disabled={isSystemProfile || !isSuperAdmin}
					/>
				</CardContent>
			</Card>
		</div>
	);
}

interface ModulesListProps {
	allowedModules: Set<string>;
	onToggle: (module: string) => void;
	onToggleGroup: (modules: string[], checked: boolean) => void;
	disabled?: boolean;
}

function ModulesList({
	allowedModules,
	onToggle,
	onToggleGroup,
	disabled,
}: ModulesListProps) {
	return (
		<div className="space-y-6">
			{Object.entries(MODULE_GROUPS).map(([groupKey, group]) => {
				const allChecked = group.modules.every((module) =>
					allowedModules.has(module),
				);
				const someChecked = group.modules.some((module) =>
					allowedModules.has(module),
				);

				return (
					<div key={groupKey} className="space-y-3">
						<div className="flex items-center gap-2">
							<Checkbox
								checked={allChecked}
								onCheckedChange={(checked) =>
									onToggleGroup(group.modules as unknown as string[], !!checked)
								}
								disabled={disabled}
							/>
							<h3 className="font-semibold text-lg">{group.label}</h3>
							{someChecked && !allChecked && (
								<Badge variant="secondary" className="text-xs">
									Parcial
								</Badge>
							)}
						</div>
						<Separator />
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pl-6">
							{group.modules.map((module) => (
								<div
									key={module}
									className="flex items-center gap-2 p-2 rounded hover:bg-muted/50"
								>
									<Checkbox
										checked={allowedModules.has(module)}
										onCheckedChange={() => onToggle(module)}
										disabled={disabled}
									/>
									<span className="text-sm">
										{MODULE_LABELS[module as Module]}
									</span>
								</div>
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
}
