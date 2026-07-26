import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState, useCallback } from "react";
import { type Law, useLaws } from "@/entities/laws";
import { lawColumns } from "@/entities/laws/model/columns";
import { useTableFilters } from "@/shared/hooks/use-table-filters";
import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/ui/data-table";
import { InputSearch } from "@/shared/ui/input-search";
import { Eye } from "lucide-react";
import { LawDetailSheet } from "./law-detail-sheet";
import { useLaw } from "@/entities/laws/api/use-laws";

export function LawsTable() {
	const filters = useTableFilters();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [detailOpen, setDetailOpen] = useState(false);

	const { data: response } = useLaws(
		{ pageIndex: filters.pagination.pageIndex, pageSize: filters.pagination.pageSize },
		{ search: filters.filters.search },
	);

	const { data: selectedLaw } = useLaw(selectedId ?? "");

	const handleView = useCallback((law: Law) => {
		setSelectedId(law.id);
		setDetailOpen(true);
	}, []);

	const columns = useMemo<ColumnDef<Law>[]>(
		() => [
			...lawColumns,
			{
				id: "actions",
				header: "Acciones",
				cell: ({ row }) => (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => handleView(row.original)}
						className="gap-1"
					>
						<Eye className="size-4" />
						Ver texto
					</Button>
				),
			},
		],
		[handleView],
	);

	return (
		<div className="space-y-6">
			<div className="flex items-end justify-between gap-2">
				<div className="flex items-center gap-2 w-full max-w-sm">
					<InputSearch
						label="Buscar"
						placeholder="Buscar ley..."
						value={filters.search}
						onChange={(value) => filters.setSearch(value)}
					/>
				</div>
			</div>

			<DataTable
				columns={columns}
				data={response?.data ?? []}
				rowCount={response?.metadata?.total ?? 0}
				pagination={filters.pagination}
				onPaginationChange={filters.setPagination}
			/>

			<LawDetailSheet
				open={detailOpen}
				onOpenChange={(open) => {
					setDetailOpen(open);
					if (!open) setSelectedId(null);
				}}
				law={selectedLaw ?? null}
			/>
		</div>
	);
}
