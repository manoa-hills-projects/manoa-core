import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useTableFilters } from "@/shared/hooks/use-table-filters";
import { houseColumns, housesConfig, useHouses, type House } from "@/entities/houses";
import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/ui/data-table";
import { ExportMenuButton } from "@/shared/ui/export-menu-button";

import { useHouseActions } from "../model/use-house-actions";
import { HouseTableActions } from "./house-table-actions";
import { HouseTableOverlays } from "./house-table-overlays";
import { InputSearch } from "@/shared/ui/input-search";
import { Plus } from "lucide-react";

export const HouseTable = () => {
	const filters = useTableFilters();
	const ui = useHouseActions();
	const { data: response } = useHouses(
		{ pageIndex: filters.pagination.pageIndex, pageSize: filters.pagination.pageSize },
		{ search: filters.filters.search }
	);

	const columns = useMemo<ColumnDef<House>[]>(() => [
		...houseColumns,
		{
			id: "actions",
			header: "Acciones",
			cell: ({ row }) => (
				<HouseTableActions
					house={row.original}
					onView={ui.openDetails}
					onEdit={ui.openEdit}
					onDelete={ui.openDelete}
				/>
			),
		},
	], [ui.openDetails, ui.openEdit, ui.openDelete]);

	return (
		<div className="space-y-6">
			<div className="flex items-end justify-between gap-2">
				<div className="flex items-center gap-2 w-full max-w-sm">
					<InputSearch
						label="Buscar"
						placeholder="Buscar vivienda o sector..."
						value={filters.search}
						onChange={(value) => filters.setSearch(value)}
					/>
				</div>
				<ExportMenuButton resource="houses" search={filters.search} />
				<Button onClick={ui.openCreate}>
					<Plus className="h-4 w-4" />
					{housesConfig.buttons.create}
				</Button>
			</div>

			<DataTable
				columns={columns}
				data={response?.data ?? []}
				rowCount={response?.metadata?.total ?? 0}
				pagination={filters.pagination}
				onPaginationChange={filters.setPagination}
			/>
			<HouseTableOverlays
				ui={ui}
				onDeleteConfirm={ui.handleConfirmDelete}
				isDeleting={ui.isDeleting}
			/>
		</div>
	);
}