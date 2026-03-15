import type { ColumnDef } from "@tanstack/react-table";
import { FileText, Link } from "lucide-react";
import type { Law } from "./types";

export const lawColumns: ColumnDef<Law>[] = [
	{
		accessorKey: "name",
		header: () => (
			<div className="flex flex-row items-center gap-1">
				<FileText className="size-3.5" /> Nombre de la Ley
			</div>
		),
	},
	{
		accessorKey: "pdf_url",
		header: () => (
			<div className="flex flex-row items-center gap-1">
				<Link className="size-3.5" /> Enlace PDF
			</div>
		),
		cell: ({ row }) => (
			<a
				href={row.original.pdf_url}
				target="_blank"
				rel="noopener noreferrer"
				className="text-primary underline-offset-4 hover:underline text-sm"
			>
				Ver PDF
			</a>
		),
	},
	{
		accessorKey: "scraped_at",
		header: "Última sincronización",
		cell: ({ row }) => {
			const val = row.original.scraped_at;
			if (!val) return "—";
			return new Date(val * 1000).toLocaleDateString("es-VE", {
				day: "2-digit",
				month: "short",
				year: "numeric",
			});
		},
	},
];
