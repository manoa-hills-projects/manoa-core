import type { ColumnDef } from "@tanstack/react-table";
import { CreditCard, HeartPulseIcon, Phone, Star, User, Users } from "lucide-react";
import type { Citizen } from "./types";
import { formatDocumentId } from "../lib/format-document-id";

const DISABILITY_LABELS: Record<string, string> = {
	visual: "Visual",
	auditiva: "Auditiva",
	fisica: "Física",
	intelectual: "Intelectual",
	psicosocial: "Psicosocial",
	multiple: "Múltiple",
	otra: "Otra",
};

export const citizenColumns: ColumnDef<Citizen>[] = [
	{
		id: "documento",
		accessorFn: (row) => formatDocumentId(row.dni_type, row.cedula),
		header: () => (
			<div className="flex flex-row items-center gap-1">
				<CreditCard className="size-3.5" /> Documento
			</div>
		),
	},
	{
		id: "phone",
		accessorKey: "phone",
		header: () => (
			<div className="flex flex-row items-center gap-1">
				<Phone className="size-3.5" /> Teléfono
			</div>
		),
		cell: ({ row }) => row.original.phone || "-",
	},
	{
		accessorKey: "names",
		header: () => (
			<div className="flex flex-row items-center gap-1">
				<User className="size-3.5" /> Nombres
			</div>
		),
	},
	{
		accessorKey: "surnames",
		header: () => (
			<div className="flex flex-row items-center gap-1">
				<Users className="size-3.5" /> Apellidos
			</div>
		),
	},
	{
		id: "disability",
		accessorKey: "has_disability",
		header: () => (
			<div className="flex flex-row items-center gap-1">
				<HeartPulseIcon className="size-3.5" /> Discapacidad
			</div>
		),
		cell: ({ row }) => {
			const d = row.original.disabilities ?? [];
			if (d.length === 0) return <span className="text-muted-foreground">—</span>;
			return (
				<div className="flex flex-wrap gap-1">
					{d.map((dis, i) => (
						<span key={i} className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700">
							{DISABILITY_LABELS[dis.disability_type] ?? dis.disability_type}
						</span>
					))}
				</div>
			);
		},
	},
	{
		accessorKey: "is_head_of_household",
		header: () => (
			<div className="flex flex-row items-center gap-1">
				<Star className="size-3.5" /> Jefe de Hogar
			</div>
		),
		cell: ({ row }) => (row.original.is_head_of_household ? "Sí" : "No"),
	},
];
