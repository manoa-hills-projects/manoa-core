import { Eye, FileDown, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { DocumentRequest } from "@/entities/requests";
import {
	downloadRequestDocument,
	REQUEST_STATUS_LABELS,
	REQUEST_TYPE_LABELS,
	useRequests,
} from "@/entities/requests";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/ui/data-table";
import { useTableFilters } from "@/shared/hooks/use-table-filters";
import { RequestDetailSheet } from "./request-detail-sheet";

export function RequestHistoryTable({ mine = true }: { mine?: boolean }) {
	const filters = useTableFilters();
	const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null);
	const [downloadingId, setDownloadingId] = useState<string | null>(null);

	const { data: response, isLoading } = useRequests({
		mine,
		page: filters.pagination.pageIndex + 1,
		limit: filters.pagination.pageSize,
	});
	const requests = response?.data ?? [];

	const parseDate = (val: string | number): string => {
		const d = typeof val === "string" ? new Date(val) : new Date(val < 10_000_000_000 ? val * 1000 : val);
		return d.toLocaleDateString("es-VE", { year: "numeric", month: "long", day: "numeric" });
	};

	const handleDownload = async (req: DocumentRequest) => {
		setDownloadingId(req.id);
		try {
			await downloadRequestDocument(req.id);
		} finally {
			setDownloadingId(null);
		}
	};

	const columns = useMemo<ColumnDef<DocumentRequest>[]>(() => [
		{
			accessorKey: "type",
			header: "Tipo",
			cell: ({ row }) => (
				<span className="font-medium">{REQUEST_TYPE_LABELS[row.original.type] ?? row.original.type}</span>
			),
		},
		{
			id: "date",
			accessorKey: "createdAt",
			header: "Fecha",
			cell: ({ row }) => <span className="text-sm text-muted-foreground">{parseDate(row.original.createdAt)}</span>,
		},
		{
			id: "status",
			accessorKey: "status",
			header: "Estado",
			cell: ({ row }) => {
				const s = row.original.status;
				const colorMap: Record<string, string> = {
					pending: "secondary",
					approved: "default",
					rejected: "destructive",
				};
				return <Badge variant={(colorMap[s] as "default" | "secondary" | "destructive") ?? "outline"}>{REQUEST_STATUS_LABELS[s] ?? s}</Badge>;
			},
		},
		{
			id: "actions",
			header: "",
			cell: ({ row }) => (
				<div className="flex items-center gap-1">
					<Button size="sm" variant="ghost" onClick={() => setSelectedRequest(row.original)}>
						<Eye className="h-4 w-4" />
					</Button>
					{row.original.status === "approved" && (
						<Button size="sm" variant="ghost" onClick={() => handleDownload(row.original)} disabled={downloadingId === row.original.id}>
							{downloadingId === row.original.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
						</Button>
					)}
				</div>
			),
		},
	], []);

	return (
		<>
			<DataTable
				columns={columns}
				data={requests}
				rowCount={response?.metadata?.total ?? 0}
				pagination={filters.pagination}
				onPaginationChange={filters.setPagination}
				isLoading={isLoading}
			/>

			<RequestDetailSheet
				request={selectedRequest}
				open={!!selectedRequest}
				onClose={() => setSelectedRequest(null)}
			/>
		</>
	);
}
