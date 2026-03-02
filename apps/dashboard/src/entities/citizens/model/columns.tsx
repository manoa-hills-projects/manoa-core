import type { ColumnDef } from "@tanstack/react-table";
import type { Citizen } from "./types";

export const citizenColumns: ColumnDef<Citizen>[] = [
	{
		accessorKey: "cedula",
		header: "Cédula",
	},
	{
		accessorKey: "names",
		header: "Nombres",
	},
	{
		accessorKey: "surnames",
		header: "Apellidos",
	},
	{
		accessorKey: "is_head_of_household",
		header: "Jefe de Hogar",
		cell: ({ row }) => (row.original.is_head_of_household ? "Sí" : "No"),
	},
];
