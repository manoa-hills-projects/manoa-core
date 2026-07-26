import type { ColumnDef } from "@tanstack/react-table";
import { FileText, ExternalLink } from "lucide-react";
import type { Law } from "./types";
import { Button } from "@/shared/ui/button";

export const lawColumns: ColumnDef<Law>[] = [
	{
		accessorKey: "name",
		header: () => (
			<div className="flex flex-row items-center gap-1">
				<FileText className="size-3.5" /> Ley
			</div>
		),
		cell: ({ row }) => (
			<div>
				<p className="font-medium">{row.original.name}</p>
				{row.original.full_text && row.original.full_text.length > 30 && row.original.full_text.length < 500 && (
					<p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 max-w-md">
						{row.original.full_text}
					</p>
				)}
			</div>
		),
	},
	{
		id: "pdf",
		header: "Documento",
		cell: ({ row }) => (
			<Button variant="ghost" size="sm" className="gap-1" asChild>
				<a href={row.original.pdf_url} target="_blank" rel="noopener noreferrer">
					<ExternalLink className="size-3.5" />
					PDF
				</a>
			</Button>
		),
	},
];
