import type { ColumnDef } from "@tanstack/react-table";
import { CreditCard, Star, User, Users } from "lucide-react";
import type { Citizen } from "./types";
import { formatDocumentId } from "../lib/format-document-id";

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
		accessorKey: "is_head_of_household",
		header: () => (
			<div className="flex flex-row items-center gap-1">
				<Star className="size-3.5" /> Jefe de Hogar
			</div>
		),
		cell: ({ row }) => (row.original.is_head_of_household ? "Sí" : "No"),
	},
];
