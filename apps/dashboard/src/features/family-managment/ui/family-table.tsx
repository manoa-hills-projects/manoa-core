import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useMemo } from "react";
import { type Family, familiesConfig, useFamilies } from "@/entities/families";
import { familyColumns } from "@/entities/families/model/columns";
import { useTableFilters } from "@/shared/hooks/use-table-filters";
import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/ui/data-table";
import { ExportMenuButton } from "@/shared/ui/export-menu-button";
import { InputSearch } from "@/shared/ui/input-search";

import { useFamilyActions } from "../model/use-family-actions";
import { FamilyTableActions } from "./family-table-actions";
import { FamilyTableOverlays } from "./family-table-overlays";

export function FamilyTable() {
	const filters = useTableFilters();
	const ui = useFamilyActions();
	const { data: response } = useFamilies(
		{
			pageIndex: filters.pagination.pageIndex,
			pageSize: filters.pagination.pageSize,
		},
		{ search: filters.filters.search },
	);

	const columns = useMemo<ColumnDef<Family>[]>(
		() => [
			...familyColumns,
			{
				id: "actions",
				header: "Acciones",
				cell: ({ row }) => (
					<FamilyTableActions
						family={row.original}
						onView={ui.openDetails}
						onEdit={ui.openEdit}
						onDelete={ui.openDelete}
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
						placeholder="Buscar familia..."
						value={filters.search}
						onChange={(value) => filters.setSearch(value)}
					/>
				</div>
				<div className="flex flex-row gap-2">
					<ExportMenuButton resource="families" search={filters.search} />
					<Button onClick={ui.openCreate}>
						<Plus className="h-4 w-4" />
						{familiesConfig.buttons.create}
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

			<FamilyTableOverlays
				ui={ui}
				onDeleteConfirm={ui.handleConfirmDelete}
				isDeleting={ui.isDeleting}
			/>
		</div>
	);
}
