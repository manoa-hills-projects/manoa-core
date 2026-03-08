import type { ColumnDef } from "@tanstack/react-table";
import { useDebounce } from "@uidotdev/usehooks";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { type Family, useDeleteFamily, useFamilies } from "@/entities/families";
import { familyColumns } from "@/entities/families/model/columns";
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

import { FamilyFormSheet } from "./family-form-sheet";

export function FamilyTable() {
	const [searchTerm, setSearchTerm] = useState("");
	const debouncedSearch = useDebounce(searchTerm, 500);

	const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

	const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	const { data } = useFamilies(pagination, {
		search: debouncedSearch,
	});

	const { mutate: deleteFamily, isPending: isDeleting } = useDeleteFamily();

	const handleSearchChange = (value: string) => {
		setSearchTerm(value);
		setPagination((prev) => ({ ...prev, pageIndex: 0 }));
	};

	const handleCreate = () => {
		setSelectedFamily(null);
		setIsSheetOpen(true);
	};

	const handleEdit = useCallback((family: Family) => {
		setSelectedFamily(family);
		setIsSheetOpen(true);
	}, []);

	const handleDeletePrompt = useCallback((family: Family) => {
		setSelectedFamily(family);
		setIsDeleteDialogOpen(true);
	}, []);

	const handleDeleteConfirm = () => {
		if (!selectedFamily) return;
		deleteFamily(selectedFamily.id, {
			onSuccess: () => {
				toast.success("Familia eliminada exitosamente");
				setIsDeleteDialogOpen(false);
				setSelectedFamily(null);
			},
			onError: () => {
				toast.error("Error al eliminar familia");
			},
		});
	};

	const columns = useMemo<ColumnDef<Family>[]>(
		() => [
			...familyColumns,
			{
				id: "actions",
				header: "Acciones",
				cell: ({ row }) => {
					const family = row.original;
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
								<DropdownMenuItem onClick={() => handleEdit(family)}>
									<Pencil className="mr-2 h-4 w-4" />
									Editar
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => handleDeletePrompt(family)}
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
						placeholder="Buscar por nombre de familia..."
						value={searchTerm}
						onChange={(e) => handleSearchChange(e.target.value)}
						className="max-w-sm"
					/>
				</div>
				<div className="flex items-center gap-2">
					<ExportMenuButton resource="families" search={debouncedSearch} />
					<Button onClick={handleCreate}>Registrar Familia</Button>
				</div>
			</div>

			<DataTable
				columns={columns}
				data={data?.data || []}
				rowCount={data?.metadata?.total || 0}
				pagination={pagination}
				onPaginationChange={setPagination}
			/>

			<FamilyFormSheet
				open={isSheetOpen}
				onOpenChange={setIsSheetOpen}
				family={selectedFamily}
			/>

			<ConfirmDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
				title="Eliminar familia"
				description={`¿Está seguro que desea eliminar la familia "${selectedFamily?.family_name}"? Esta acción no se puede deshacer.`}
				onConfirm={handleDeleteConfirm}
				isLoading={isDeleting}
			/>
		</div>
	);
}
