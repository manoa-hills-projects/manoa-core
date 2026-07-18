/**
 * Página de gestión de perfiles RBAC
 *
 * Sigue el mismo patrón de tabla que ciudadanos, viviendas, etc.
 * Usa DataTableActions para dropdown de acciones.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
	Eye,
	Lock,
	Plus,
	ShieldCheck,
	Trash,
	User,
	UserCog,
	Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	useCreateProfile,
	useDeleteProfile,
	useProfiles,
} from "@/entities/profiles";
import { usePermissions } from "@/hooks/use-permissions";
import { useTableFilters } from "@/shared/hooks/use-table-filters";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/ui/data-table";
import {
	type ActionItem,
	DataTableActions,
} from "@/shared/ui/data-table-actions";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { InputSearch } from "@/shared/ui/input-search";
import { Label } from "@/shared/ui/label";
import { ProtectedRoute } from "@/shared/ui/protected-route";
import { Textarea } from "@/shared/ui/textarea";
import { SectionHeader } from "@/widgets/section-header/ui/section-header";

export const Route = createFileRoute("/_authenticated/profiles/")({
	component: ProfilesPage,
});

type ProfileRow = {
	id: string;
	key: string;
	name: string;
	description: string | null;
	isSystem: boolean;
	isDefault: boolean;
	isActive: boolean;
};

function getProfileType(key: string): "admin" | "client" {
	if (key === "super_admin" || key === "admin") return "admin";
	return "client";
}

function ProfilesPage() {
	const { isSuperAdmin } = usePermissions();
	const navigate = useNavigate();
	const filters = useTableFilters();
	const { data: response } = useProfiles();
	const deleteMutation = useDeleteProfile();
	const createMutation = useCreateProfile();
	const [deleteDialog, setDeleteDialog] = useState<ProfileRow | null>(null);
	const [createOpen, setCreateOpen] = useState(false);
	const [newProfile, setNewProfile] = useState({
		key: "",
		name: "",
		description: "",
	});

	const profiles = response?.data ?? [];

	// Filtrar localmente por search (hasta que el backend soporte búsqueda)
	const filteredProfiles = useMemo(() => {
		if (!filters.search) return profiles;
		const search = filters.search.toLowerCase();
		return profiles.filter(
			(p) =>
				p.name.toLowerCase().includes(search) ||
				p.key.toLowerCase().includes(search) ||
				(p.description?.toLowerCase().includes(search) ?? false),
		);
	}, [profiles, filters.search]);

	const handleDelete = async () => {
		if (!deleteDialog) return;
		try {
			await deleteMutation.mutateAsync(deleteDialog.id);
			toast.success("Perfil eliminado");
		} catch (error: any) {
			toast.error(error?.message || "Error al eliminar");
		} finally {
			setDeleteDialog(null);
		}
	};

	const handleCreate = async () => {
		if (!newProfile.key || !newProfile.name) {
			toast.error("Clave y nombre son obligatorios");
			return;
		}
		try {
			await createMutation.mutateAsync({
				key: newProfile.key.toLowerCase().replace(/\s+/g, "_"),
				name: newProfile.name,
				description: newProfile.description || undefined,
			});
			toast.success("Perfil creado");
			setCreateOpen(false);
			setNewProfile({ key: "", name: "", description: "" });
		} catch (error: any) {
			toast.error(error?.message || "Error al crear");
		}
	};

	const columns = useMemo<ColumnDef<ProfileRow>[]>(
		() => [
			{
				accessorKey: "name",
				header: "Perfil",
				cell: ({ row }) => (
					<div className="flex items-center gap-2">
						{row.original.isSystem ? (
							<ShieldCheck className="h-4 w-4 text-primary" />
						) : (
							<Users className="h-4 w-4 text-muted-foreground" />
						)}
						<span className="font-medium">{row.original.name}</span>
					</div>
				),
			},
			{
				id: "type",
				header: "Tipo",
				cell: ({ row }) => {
					const type = getProfileType(row.original.key);
					return (
						<Badge
							variant={type === "admin" ? "default" : "outline"}
							className="gap-1"
						>
							{type === "admin" ? (
								<UserCog className="h-3 w-3" />
							) : (
								<User className="h-3 w-3" />
							)}
							{type === "admin" ? "Admin" : "Cliente"}
						</Badge>
					);
				},
			},
			{
				accessorKey: "description",
				header: "Descripción",
				cell: ({ getValue }) => (
					<span className="text-muted-foreground truncate max-w-[250px] block">
						{getValue<string>() || "-"}
					</span>
				),
			},
			{
				id: "protected",
				header: "Protegido",
				cell: ({ row }) => {
					const isProtected =
						row.original.key === "super_admin" ||
						row.original.key === "citizen";
					if (!isProtected)
						return <span className="text-muted-foreground text-sm">-</span>;
					return (
						<Badge variant="outline" className="gap-1 text-xs">
							<Lock className="h-3 w-3" />
							{row.original.isSystem ? "Sistema" : "Default"}
						</Badge>
					);
				},
			},
			{
				id: "actions",
				header: "",
				cell: ({ row }) => {
					const isProtected =
						row.original.key === "super_admin" ||
						row.original.key === "citizen";

					const actions = useMemo<ActionItem<ProfileRow>[]>(
						() => [
							{
								label: "Editar",
								icon: Eye,
								onClick: () => {
									navigate({
										to: "/profiles/$profileId",
										params: { profileId: row.original.id },
									});
								},
							},
							...(isSuperAdmin && !isProtected
								? [
										{
											label: "Eliminar",
											icon: Trash,
											onClick: () => setDeleteDialog(row.original),
											className:
												"text-red-600 focus:bg-red-50 focus:text-red-600",
										},
									]
								: []),
						],
						[row.original.id, isProtected, row.original],
					);

					return (
						<DataTableActions
							data={row.original}
							actions={actions}
							label="Acciones"
						/>
					);
				},
			},
		],
		[isSuperAdmin, navigate],
	);

	return (
		<ProtectedRoute module="profiles">
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<SectionHeader
						name="Perfiles"
						description="Gestiona los perfiles del sistema y qué módulos puede ver cada uno."
					/>
					{isSuperAdmin && (
						<Button onClick={() => setCreateOpen(true)}>
							<Plus className="h-4 w-4 mr-2" />
							Nuevo Perfil
						</Button>
					)}
				</div>

				<div className="space-y-4">
					<div className="flex items-end justify-between gap-2">
						<div className="flex items-center gap-2 w-full max-w-sm">
							<InputSearch
								label="Buscar"
								placeholder="Buscar perfil..."
								value={filters.search}
								onChange={(value) => filters.setSearch(value)}
							/>
						</div>
					</div>

					<DataTable
						columns={columns}
						data={filteredProfiles}
						rowCount={filteredProfiles.length}
						pagination={filters.pagination}
						onPaginationChange={filters.setPagination}
					/>
				</div>

				{/* Dialog: Crear Perfil */}
				<Dialog open={createOpen} onOpenChange={setCreateOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Nuevo Perfil</DialogTitle>
							<DialogDescription>
								Crea un perfil personalizado. Luego configura qué módulos puede
								ver.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="key">Clave única</Label>
								<Input
									id="key"
									placeholder="ej: tesorero"
									value={newProfile.key}
									onChange={(e) =>
										setNewProfile({ ...newProfile, key: e.target.value })
									}
								/>
								<p className="text-xs text-muted-foreground">
									Solo minúsculas, números y _
								</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor="name">Nombre</Label>
								<Input
									id="name"
									placeholder="ej: Tesorero"
									value={newProfile.name}
									onChange={(e) =>
										setNewProfile({ ...newProfile, name: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="desc">Descripción</Label>
								<Textarea
									id="desc"
									placeholder="Propósito del perfil..."
									value={newProfile.description}
									onChange={(e) =>
										setNewProfile({
											...newProfile,
											description: e.target.value,
										})
									}
									rows={3}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setCreateOpen(false)}>
								Cancelar
							</Button>
							<Button
								onClick={handleCreate}
								disabled={createMutation.isPending}
							>
								{createMutation.isPending ? "Creando..." : "Crear"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Dialog: Eliminar */}
				<Dialog
					open={!!deleteDialog}
					onOpenChange={() => setDeleteDialog(null)}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Eliminar Perfil</DialogTitle>
							<DialogDescription>
								¿Eliminar "{deleteDialog?.name}"? Esta acción no se puede
								deshacer.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button variant="outline" onClick={() => setDeleteDialog(null)}>
								Cancelar
							</Button>
							<Button
								variant="destructive"
								onClick={handleDelete}
								disabled={deleteMutation.isPending}
							>
								{deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</ProtectedRoute>
	);
}
