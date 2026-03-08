import type { ColumnDef } from "@tanstack/react-table";
import { useDebounce } from "@uidotdev/usehooks";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import {
	type Citizen,
	useCitizens,
	useDeleteCitizen,
} from "@/entities/citizens";
import { citizenColumns } from "@/entities/citizens/model/columns";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { DataTable } from "@/shared/ui/data-table";
import { ExportMenuButton } from "@/shared/ui/export-menu-button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";

import { CitizenFormSheet } from "./citizen-form-sheet";

export function CitizenTable() {
	const [searchTerm, setSearchTerm] = useState("");
	const debouncedSearch = useDebounce(searchTerm, 500);

	const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

	const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	const { data } = useCitizens(pagination, {
		search: debouncedSearch,
	});

	const { mutate: deleteCitizen, isPending: isDeleting } = useDeleteCitizen();

	const handleSearchChange = (value: string) => {
		setSearchTerm(value);
		setPagination((prev) => ({ ...prev, pageIndex: 0 }));
	};

	const handleCreate = () => {
		setSelectedCitizen(null);
		setIsSheetOpen(true);
	};

	const handleEdit = useCallback((citizen: Citizen) => {
		setSelectedCitizen(citizen);
		setIsSheetOpen(true);
	}, []);

	const handleDeletePrompt = useCallback((citizen: Citizen) => {
		setSelectedCitizen(citizen);
		setIsDeleteDialogOpen(true);
	}, []);

	const handleDeleteConfirm = () => {
		if (!selectedCitizen) return;
		deleteCitizen(selectedCitizen.id, {
			onSuccess: () => {
				toast.success("Ciudadano eliminado exitosamente");
				setIsDeleteDialogOpen(false);
				setSelectedCitizen(null);
			},
			onError: () => {
				toast.error("Error al eliminar ciudadano");
			},
		});
	};

	const columns = useMemo<ColumnDef<Citizen>[]>(
		() => [
			...citizenColumns,
			{
				id: "actions",
				header: "Acciones",
				cell: ({ row }) => {
					const citizen = row.original;
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
								<DropdownMenuItem onClick={() => handleEdit(citizen)}>
									<Pencil className="mr-2 h-4 w-4" />
									Editar
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => handleDeletePrompt(citizen)}
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
		[handleDeletePrompt, handleEdit],
	);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-between items-center">
				<div className="flex items-center gap-2">
					<Input
						placeholder="Buscar por cédula..."
						value={searchTerm}
						onChange={(e) => handleSearchChange(e.target.value)}
						className="max-w-sm"
					/>
				</div>
				<div className="flex items-center gap-2">
					<ExportMenuButton resource="citizens" search={debouncedSearch} />
					<Button onClick={handleCreate}>Registrar Ciudadano</Button>
				</div>
			</div>

			<DataTable
				columns={columns}
				data={data?.data || []}
				rowCount={data?.metadata?.total || 0}
				pagination={pagination}
				onPaginationChange={setPagination}
			/>

			<CitizenFormSheet
				open={isSheetOpen}
				onOpenChange={setIsSheetOpen}
				citizen={selectedCitizen}
			/>

			<ConfirmDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
				title="Eliminar ciudadano"
				description={`¿Está seguro que desea eliminar a ${selectedCitizen?.names} ${selectedCitizen?.surnames}? Esta acción no se puede deshacer.`}
				onConfirm={handleDeleteConfirm}
				isLoading={isDeleting}
			/>
		</div>
	);
}
