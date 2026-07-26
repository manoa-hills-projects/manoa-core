import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PlusIcon, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import type { Poll } from "@/entities/polls";
import { usePolls } from "@/entities/polls";
import { usePermissions } from "@/hooks/use-permissions";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/ui/data-table";
import { InputSearch } from "@/shared/ui/input-search";
import { useTableFilters } from "@/shared/hooks/use-table-filters";
import { PollFormSheet } from "./poll-form-sheet";

interface PollListProps {
	onChange?: () => void;
}

export function PollList({ onChange }: PollListProps) {
	const filters = useTableFilters();
	const { canManage } = usePermissions();
	const isAdmin = canManage("polls");
	const [sheetOpen, setSheetOpen] = useState(false);

	const { data: response, isLoading } = usePolls({
		page: filters.pagination.pageIndex + 1,
		limit: filters.pagination.pageSize,
		search: filters.filters.search,
	});

	const polls = response?.data ?? [];

	const columns = useMemo<ColumnDef<Poll>[]>(() => {
		const cols: ColumnDef<Poll>[] = [
			{
				accessorKey: "title",
				header: "Título",
				cell: ({ row }) => (
					<div>
						<p className="font-medium">{row.original.title}</p>
						{row.original.description && (
							<p className="text-xs text-muted-foreground truncate max-w-[300px]">
								{row.original.description}
							</p>
						)}
					</div>
				),
			},
			{
				id: "status",
				accessorKey: "status",
				header: "Estado",
				cell: ({ row }) => (
					<Badge variant={row.original.status === "open" ? "default" : "secondary"}>
						{row.original.status === "open" ? "Activa" : "Cerrada"}
					</Badge>
				),
			},
			{
				id: "votes",
				accessorKey: "totalVotes",
				header: "Votos",
				cell: ({ row }) => row.original.totalVotes,
			},
			{
				id: "createdAt",
				accessorKey: "createdAt",
				header: "Fecha",
				cell: ({ row }) =>
					format(new Date(row.original.createdAt), "PPP", { locale: es }),
			},
		];

		if (isAdmin) {
			cols.push({
				id: "voted",
				header: "Mi Voto",
				cell: ({ row }) =>
					row.original.hasVoted ? (
						<Badge variant="outline" className="text-emerald-600">Votó</Badge>
					) : (
						<span className="text-muted-foreground">—</span>
					),
			});
		}

		return cols;
	}, [isAdmin]);

	return (
		<div className="space-y-6">
			<div className="flex items-end justify-between gap-2">
				<div className="flex items-center gap-2 w-full max-w-sm">
					<InputSearch
						label="Buscar"
						placeholder="Buscar votación..."
						value={filters.search}
						onChange={(value) => filters.setSearch(value)}
					/>
				</div>
				{isAdmin && (
					<Button onClick={() => setSheetOpen(true)}>
						<PlusIcon className="h-4 w-4" />
						Crear Votación
					</Button>
				)}
			</div>

			<DataTable
				columns={columns}
				data={polls}
				rowCount={response?.metadata?.total ?? 0}
				pagination={filters.pagination}
				onPaginationChange={filters.setPagination}
				isLoading={isLoading}
			/>

			<PollFormSheet
				open={sheetOpen}
				onOpenChange={setSheetOpen}
				onSuccess={onChange}
			/>
		</div>
	);
}
