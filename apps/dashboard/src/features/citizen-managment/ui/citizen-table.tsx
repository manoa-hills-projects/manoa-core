import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useMemo } from "react";
import { type Citizen, useCitizens } from "@/entities/citizens";
import { citizenColumns } from "@/entities/citizens/model/columns";
import { useTableFilters } from "@/shared/hooks/use-table-filters";
import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/ui/data-table";
import { ExportMenuButton } from "@/shared/ui/export-menu-button";
import { InputSearch } from "@/shared/ui/input-search";

import { useCitizenActions } from "../model/use-citizen-actions";
import { CitizenTableActions } from "./citizen-table-actions";
import { CitizenTableOverlays } from "./citizen-table-overlays";

export function CitizenTable() {
	const filters = useTableFilters();
	const ui = useCitizenActions();
	const { data: response } = useCitizens(
		{
			pageIndex: filters.pagination.pageIndex,
			pageSize: filters.pagination.pageSize,
		},
		{ search: filters.filters.search },
	);

	const columns = useMemo<ColumnDef<Citizen>[]>(
		() => [
			...citizenColumns,
			{
				id: "actions",
				header: "Acciones",
				cell: ({ row }) => (
					<CitizenTableActions
						citizen={row.original}
						onView={ui.openDetails}
						onEdit={ui.openEdit}
						onDelete={ui.openDelete}
						onDownloadLetter={ui.openLetterModal}
					/>
				),
			},
		],
		[ui.openDetails, ui.openEdit, ui.openDelete],
	);

	return (
		<div className="space-y-6">
			<div className="flex items-end justify-between gap-2">
				<div className="flex items-center gap-2 w-full max-w-sm">
					<InputSearch
						label="Buscar"
						placeholder="Buscar ciudadano..."
						value={filters.search}
						onChange={(value) => filters.setSearch(value)}
					/>
				</div>
				<div className="flex flex-row gap-2">
					<ExportMenuButton resource="citizens" search={filters.search} />
					<Button onClick={ui.openCreate}>
						<Plus className="h-4 w-4" />
						Crear Ciudadano
					</Button>
				</div>
			</div>

			<DataTable
				columns={columns}
				data={response?.data ?? []}
				rowCount={response?.metadata?.total ?? 0}
				pagination={filters.pagination}
				onPaginationChange={filters.setPagination}
			/>

			<CitizenTableOverlays
				ui={ui}
				onDeleteConfirm={ui.handleConfirmDelete}
				isDeleting={ui.isDeleting}
			/>
		</div>
	);
}
