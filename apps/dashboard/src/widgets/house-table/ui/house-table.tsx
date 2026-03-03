import { useDebouncedValue } from "@tanstack/react-pacer";
import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { toast } from "sonner";

import { houseColumns, useHouses, useDeleteHouse } from "@/entities/houses";
import type { House } from "@/entities/houses/model/types";
import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/ui/data-table";
import { Input } from "@/shared/ui/input";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

import { HouseFormSheet } from "./house-form-sheet";

export function HouseTable() {
	const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
	const [search, setSearch] = useState("");
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	const [debouncedSearch] = useDebouncedValue(search, {
		wait: 500,
	});

	const { data: response, isLoading } = useHouses(
		{
			pageIndex: pagination.pageIndex,
			pageSize: pagination.pageSize,
		},
		{
			search: debouncedSearch,
		},
	);

	const { mutate: deleteHouse, isPending: isDeleting } = useDeleteHouse();

	const handleCreate = () => {
		setSelectedHouse(null);
		setIsSheetOpen(true);
	};

	const handleEdit = (house: House) => {
		setSelectedHouse(house);
		setIsSheetOpen(true);
	};

	const handleDeletePrompt = (house: House) => {
		setSelectedHouse(house);
		setIsDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = () => {
		if (!selectedHouse) return;
		deleteHouse(selectedHouse.id, {
			onSuccess: () => {
				toast.success("Casa eliminada exitosamente");
				setIsDeleteDialogOpen(false);
				setSelectedHouse(null);
			},
			onError: () => {
				toast.error("Error al eliminar casa");
			},
		});
	};

	const columns = useMemo<ColumnDef<House>[]>(
		() => [
			...houseColumns,
			{
				id: "actions",
				cell: ({ row }) => {
					const house = row.original;
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
								<DropdownMenuItem onClick={() => handleEdit(house)}>
									<Pencil className="mr-2 h-4 w-4" />
									Editar
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => handleDeletePrompt(house)}
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
		[]
	);


	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2 w-full max-w-sm">
					<Input
						placeholder="Buscar casa o sector..."
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPagination((prev) => ({ ...prev, pageIndex: 0 }));
						}}
					/>
					{isLoading && (
						<span className="text-sm animate-pulse whitespace-nowrap">Buscando...</span>
					)}
				</div>
				<Button onClick={handleCreate}>Registrar Casa</Button>
			</div>

			<DataTable
				columns={columns}
				data={response?.data ?? []}
				rowCount={response?.metadata?.total ?? 0}
				pagination={pagination}
				onPaginationChange={setPagination}
			/>

			<HouseFormSheet 
				open={isSheetOpen} 
				onOpenChange={setIsSheetOpen} 
				house={selectedHouse} 
			/>
			
			<ConfirmDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
				title="Eliminar casa"
				description={`¿Está seguro que desea eliminar la casa ${selectedHouse?.number}, sector ${selectedHouse?.sector}? Esta acción no se puede deshacer.`}
				onConfirm={handleDeleteConfirm}
				isLoading={isDeleting}
			/>
		</div>
	);
}
