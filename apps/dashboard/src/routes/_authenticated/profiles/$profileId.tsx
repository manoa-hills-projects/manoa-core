/**
 * Página de detalle de perfil - Editor de perfil y permisos
 *
 * Permite editar la información del perfil (nombre, descripción, activo, default)
 * y gestionar qué módulos puede ver cada perfil en el panel.
 *
 * @route /_authenticated/profiles/$profileId
 */

import {
	IconAlertCircle,
	IconArrowLeft,
	IconCheck,
	IconLock,
	IconShield,
	IconUsers,
} from "@tabler/icons-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Module } from "@/entities/profiles";
import {
	MODULE_GROUPS,
	MODULE_LABELS,
	useProfile,
	useUpdatePermissions,
	useUpdateProfile,
} from "@/entities/profiles";
import { usePermissions } from "@/hooks/use-permissions";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ProtectedRoute } from "@/shared/ui/protected-route";
import { Separator } from "@/shared/ui/separator";
import { Skeleton } from "@/shared/ui/skeleton";
import { Switch } from "@/shared/ui/switch";
import { Textarea } from "@/shared/ui/textarea";

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
	const { data: profile, isLoading, isError } = useProfile(profileId);
	const updateProfileMutation = useUpdateProfile();
	const updatePermissionsMutation = useUpdatePermissions();

	// ── Estado del formulario ──
	const [profileName, setProfileName] = useState("");
	const [profileDescription, setProfileDescription] = useState("");
	const [isActive, setIsActive] = useState(true);
	const [isDefault, setIsDefault] = useState(false);
	const [allowedModules, setAllowedModules] = useState<Set<string>>(new Set());

	// Valores originales para detectar cambios
	const [original, setOriginal] = useState({
		name: "",
		description: "",
		isActive: true,
		isDefault: false,
		modules: new Set<string>(),
	});

	// Inicializar estado desde el perfil
	useEffect(() => {
		if (!profile) return;

		setProfileName(profile.name);
		setProfileDescription(profile.description ?? "");
		setIsActive(profile.isActive);
		setIsDefault(profile.isDefault);

		const modules = new Set(
			profile.permissions
				?.filter((p) => p.allowed && p.action === "view")
				.map((p) => p.module) ?? [],
		);
		setAllowedModules(modules);

		setOriginal({
			name: profile.name,
			description: profile.description ?? "",
			isActive: profile.isActive,
			isDefault: profile.isDefault,
			modules: new Set(modules),
		});
	}, [profile]);

	// ── Detectar cambios ──
	const hasInfoChanges = useMemo(
		() =>
			profileName !== original.name ||
			profileDescription !== original.description ||
			isActive !== original.isActive ||
			isDefault !== original.isDefault,
		[profileName, original, profileDescription, isActive, isDefault],
	);

	const hasPermissionsChanges = useMemo(() => {
		if (original.modules.size !== allowedModules.size) return true;
		return [...allowedModules].some((m) => !original.modules.has(m));
	}, [allowedModules, original.modules]);

	const hasChanges = hasInfoChanges || hasPermissionsChanges;
	const isSaving =
		updateProfileMutation.isPending || updatePermissionsMutation.isPending;

	// ── Handlers ──
	const toggleModule = (module: string) => {
		setAllowedModules((prev) => {
			const next = new Set(prev);
			if (next.has(module)) next.delete(module);
			else next.add(module);
			return next;
		});
	};

	const toggleGroup = (modules: readonly string[], checked: boolean) => {
		setAllowedModules((prev) => {
			const next = new Set(prev);
			for (const m of modules) {
				if (checked) next.add(m);
				else next.delete(m);
			}
			return next;
		});
	};

	const handleSave = async () => {
		try {
			if (hasInfoChanges) {
				await updateProfileMutation.mutateAsync({
					id: profileId,
					data: {
						name: profileName,
						description: profileDescription || undefined,
						isActive,
						isDefault,
					},
				});
			}

			if (hasPermissionsChanges) {
				const permissionsArray = Array.from(allowedModules).map(
					(module) => ({
						module,
						action: "view" as const,
						allowed: true,
					}),
				);
				await updatePermissionsMutation.mutateAsync({
					id: profileId,
					data: { permissions: permissionsArray },
				});
			}

			toast.success("Perfil actualizado correctamente");

			setOriginal({
				name: profileName,
				description: profileDescription,
				isActive,
				isDefault,
				modules: new Set(allowedModules),
			});
		} catch (error: any) {
			toast.error(error?.message || "Error al actualizar el perfil");
		}
	};

	const handleCancel = () => {
		setProfileName(original.name);
		setProfileDescription(original.description);
		setIsActive(original.isActive);
		setIsDefault(original.isDefault);
		setAllowedModules(new Set(original.modules));
	};

	// ── Loading ──
	if (isLoading) {
		return (
			<div className="p-6 space-y-6 max-w-4xl mx-auto">
				<Skeleton className="h-10 w-72" />
				<Skeleton className="h-52" />
				<Skeleton className="h-96" />
			</div>
		);
	}

	// ── Error ──
	if (isError || !profile) {
		return (
			<div className="p-6">
				<div className="flex flex-col items-center justify-center gap-4 py-20">
					<IconAlertCircle className="h-12 w-12 text-destructive" />
					<p className="text-lg font-medium text-destructive">
						Perfil no encontrado
					</p>
					<Button
						variant="outline"
						onClick={() => navigate({ to: "/profiles" })}
					>
						<IconArrowLeft className="h-4 w-4 mr-2" />
						Volver a perfiles
					</Button>
				</div>
			</div>
		);
	}

	const isSystemProfile = profile.key === "super_admin";

	return (
		<div className="p-6 space-y-6 max-w-4xl mx-auto">
			{/* ════════════════════════════════════════════ */}
			{/* HEADER                                      */}
			{/* ════════════════════════════════════════════ */}
			<div className="flex items-start gap-4">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => navigate({ to: "/profiles" })}
					className="mt-1 shrink-0"
				>
					<IconArrowLeft className="h-5 w-5" />
				</Button>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-3 flex-wrap">
						<h1 className="text-2xl font-bold tracking-tight truncate">
							{profileName || "Sin nombre"}
						</h1>
						{profile.isSystem && (
							<Badge variant="outline" className="gap-1 shrink-0">
								<IconLock className="h-3 w-3" />
								Sistema
							</Badge>
						)}
						{!isActive && (
							<Badge variant="destructive" className="shrink-0">
								Inactivo
							</Badge>
						)}
					</div>
					<div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
						<span className="flex items-center gap-1">
							<IconUsers className="h-3.5 w-3.5" />
							{profile.userCount} usuario
							{profile.userCount !== 1 ? "s" : ""} asignado
							{profile.userCount !== 1 ? "s" : ""}
						</span>
						<span className="font-mono text-xs">clave: {profile.key}</span>
					</div>
				</div>
			</div>

			{/* ════════════════════════════════════════════ */}
			{/* INFORMACIÓN DEL PERFIL                       */}
			{/* ════════════════════════════════════════════ */}
			<Card>
				<CardHeader>
					<CardTitle>Información del Perfil</CardTitle>
				</CardHeader>
				<CardContent className="space-y-5">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<div className="space-y-2">
							<Label htmlFor="name">Nombre</Label>
							<Input
								id="name"
								value={profileName}
								onChange={(e) => setProfileName(e.target.value)}
								disabled={isSystemProfile}
								placeholder="Nombre del perfil"
							/>
							{isSystemProfile && (
								<p className="text-xs text-muted-foreground">
									Los perfiles del sistema no se pueden renombrar
								</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="key">Clave única</Label>
							<Input
								id="key"
								value={profile.key}
								disabled
								className="bg-muted/50"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Descripción</Label>
						<Textarea
							id="description"
							value={profileDescription}
							onChange={(e) => setProfileDescription(e.target.value)}
							disabled={isSystemProfile}
							placeholder="Propósito del perfil..."
							rows={3}
						/>
					</div>

					<Separator />

					<div className="flex flex-wrap gap-6">
						<div className="flex items-center gap-3">
							<Switch
								id="isActive"
								checked={isActive}
								onCheckedChange={setIsActive}
								disabled={isSystemProfile || !isSuperAdmin}
							/>
							<div>
								<Label htmlFor="isActive" className="font-medium">
									Perfil activo
								</Label>
								<p className="text-xs text-muted-foreground">
									Los usuarios con este perfil pueden acceder al sistema
								</p>
							</div>
						</div>

						{isSuperAdmin && (
							<div className="flex items-center gap-3">
								<Switch
									id="isDefault"
									checked={isDefault}
									onCheckedChange={setIsDefault}
									disabled={isSystemProfile}
								/>
								<div>
									<Label htmlFor="isDefault" className="font-medium">
										Perfil por defecto
									</Label>
									<p className="text-xs text-muted-foreground">
										Asignado automáticamente a nuevos registros
									</p>
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* ════════════════════════════════════════════ */}
			{/* MÓDULOS VISIBLES                              */}
			{/* ════════════════════════════════════════════ */}
			<Card>
				<CardHeader>
					<CardTitle>Módulos Visibles</CardTitle>
					<p className="text-sm text-muted-foreground">
						Selecciona qué módulos puede ver este perfil en el panel de
						administración
					</p>
				</CardHeader>
				<CardContent>
					{isSystemProfile ? (
						<div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
							<p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
								<IconShield className="h-4 w-4 shrink-0" />
								El Super Administrador tiene acceso a todos los módulos del
								sistema. No se pueden modificar sus permisos.
							</p>
						</div>
					) : (
						<ModulesList
							allowedModules={allowedModules}
							onToggle={toggleModule}
							onToggleGroup={toggleGroup}
							disabled={!isSuperAdmin}
						/>
					)}
				</CardContent>
			</Card>

			{/* ════════════════════════════════════════════ */}
			{/* STICKY FOOTER (solo si hay cambios)          */}
			{/* ════════════════════════════════════════════ */}
			{hasChanges && (
				<div className="sticky bottom-0 bg-background border rounded-lg p-4 flex items-center justify-between shadow-lg -mx-1">
					<p className="text-sm text-muted-foreground">
						Tienes cambios sin guardar
					</p>
					<div className="flex items-center gap-3">
						<Button
							variant="outline"
							onClick={handleCancel}
							disabled={isSaving}
						>
							Descartar
						</Button>
						<Button onClick={handleSave} disabled={isSaving}>
							<IconCheck className="h-4 w-4 mr-2" />
							{isSaving ? "Guardando..." : "Guardar Cambios"}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════
// MODULES LIST
// ═══════════════════════════════════════════════════════════════

interface ModulesListProps {
	allowedModules: Set<string>;
	onToggle: (module: string) => void;
	onToggleGroup: (modules: readonly string[], checked: boolean) => void;
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
				const modules = [...group.modules];
				const allChecked = modules.every((m) => allowedModules.has(m));
				const someChecked = modules.some((m) => allowedModules.has(m));

				return (
					<div key={groupKey} className="space-y-3">
						<div className="flex items-center gap-3">
							<Checkbox
								checked={allChecked}
								onCheckedChange={(checked) =>
									onToggleGroup(modules, !!checked)
								}
								disabled={disabled}
							/>
							<h3 className="font-semibold text-base">{group.label}</h3>
							{someChecked && !allChecked && (
								<Badge variant="secondary" className="text-xs">
									Parcial
								</Badge>
							)}
							<span className="text-xs text-muted-foreground">
								({modules.length})
							</span>
						</div>
						<Separator />
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pl-6">
							{modules.map((module) => {
								const isChecked = allowedModules.has(module);
								return (
									<label
										key={module}
										className={`flex items-center gap-2.5 p-2.5 rounded-md cursor-pointer transition-colors
											${
												isChecked
													? "bg-primary/5 hover:bg-primary/10"
													: "hover:bg-muted/50"
											}
											${disabled ? "opacity-60 cursor-not-allowed" : ""}
										`}
									>
										<Checkbox
											checked={isChecked}
											onCheckedChange={() => onToggle(module)}
											disabled={disabled}
										/>
										<span className="text-sm font-medium">
											{MODULE_LABELS[module as Module]}
										</span>
									</label>
								);
							})}
						</div>
					</div>
				);
			})}
		</div>
	);
}
