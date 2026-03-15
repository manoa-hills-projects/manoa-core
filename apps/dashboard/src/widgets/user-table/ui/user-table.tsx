import type { ColumnDef } from "@tanstack/react-table";
import { useDebounce } from "@uidotdev/usehooks";
import { Key, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
	type User,
	useDeleteUser,
	useResetUserPassword,
	useUsers,
} from "@/entities/users";
import { userColumns } from "@/entities/users/model/columns";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { DataTable } from "@/shared/ui/data-table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";

import { UserFormSheet } from "./user-form-sheet";

export function UserTable() {
	const [searchTerm, setSearchTerm] = useState("");
	const debouncedSearch = useDebounce(searchTerm, 500);

	const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
	const [newPassword, setNewPassword] = useState("");

	const { data } = useUsers(pagination, {
		search: debouncedSearch,
	});

	const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();
	const { mutateAsync: resetPassword } = useResetUserPassword();

	const handleSearchChange = (value: string) => {
		setSearchTerm(value);
		setPagination((prev) => ({ ...prev, pageIndex: 0 }));
	};

	const handleCreate = () => {
		setSelectedUser(null);
		setIsSheetOpen(true);
	};

	const handleEdit = (user: User) => {
		setSelectedUser(user);
		setIsSheetOpen(true);
	};

	const handleDeletePrompt = (user: User) => {
		setSelectedUser(user);
		setIsDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = () => {
		if (!selectedUser) return;
		deleteUser(selectedUser.id, {
			onSuccess: () => {
				toast.success("Usuario eliminado exitosamente");
				setIsDeleteDialogOpen(false);
				setSelectedUser(null);
			},
			onError: (error: any) => {
				toast.error(error.message || "Error al eliminar usuario");
			},
		});
	};

	const handleResetPasswordPrompt = (user: User) => {
		setSelectedUser(user);
		setNewPassword("");
		setIsResetPasswordOpen(true);
	};

	const handleResetPasswordConfirm = async () => {
		if (!selectedUser) return;

		if (newPassword.length < 6) {
			toast.error("La contraseña debe tener al menos 6 caracteres");
			return;
		}

		try {
			await resetPassword({ id: selectedUser.id, newPassword });
			toast.success("Contraseña actualizada exitosamente");
			setIsResetPasswordOpen(false);
		} catch (error: any) {
			toast.error(error.message || "Error al actualizar contraseña");
		}
	};

	const columns = useMemo<ColumnDef<User>[]>(
		() => [
			...userColumns,
			{
				id: "actions",
				header: "Acciones",
				cell: ({ row }) => {
					const user = row.original;
					return (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" className="h-8 w-8 p-0">
									<span className="sr-only">Abrir menú</span>
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuLabel>Acciones</DropdownMenuLabel>
								<DropdownMenuItem onClick={() => handleEdit(user)}>
									<Pencil className="mr-2 h-4 w-4" />
									Editar
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => handleResetPasswordPrompt(user)}
								>
									<Key className="mr-2 h-4 w-4" />
									Resetear Clave
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => handleDeletePrompt(user)}
									className="text-red-600 focus:bg-red-50 focus:text-red-600"
								>
									<Trash className="mr-2 h-4 w-4" />
									Eliminar
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					);
				},
			},
		],
		[],
	);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-between items-center gap-2">
				<Input
					placeholder="Buscar usuario por nombre o correo..."
					value={searchTerm}
					onChange={(e) => handleSearchChange(e.target.value)}
					className="max-w-sm"
				/>
				<Button onClick={handleCreate}>Registrar Usuario</Button>
			</div>

			<DataTable
				columns={columns}
				data={data?.data || []}
				rowCount={data?.metadata?.total || 0}
				pagination={pagination}
				onPaginationChange={setPagination}
			/>

			<UserFormSheet
				open={isSheetOpen}
				onOpenChange={setIsSheetOpen}
				user={selectedUser}
			/>

			<ConfirmDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
				title="Eliminar usuario"
				description={`¿Está seguro que desea eliminar a ${selectedUser?.name}? Esta acción no se puede deshacer.`}
				onConfirm={handleDeleteConfirm}
				isLoading={isDeleting}
			/>

			<Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Resetear Contraseña</DialogTitle>
						<DialogDescription>
							Ingrese la nueva contraseña para {selectedUser?.name}.
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<Input
							type="password"
							placeholder="Nueva contraseña"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsResetPasswordOpen(false)}
						>
							Cancelar
						</Button>
						<Button onClick={handleResetPasswordConfirm}>Guardar</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
