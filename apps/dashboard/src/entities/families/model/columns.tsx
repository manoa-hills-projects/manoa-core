import type { ColumnDef } from "@tanstack/react-table";
import type { Family } from "./types";

export const familyColumns: ColumnDef<Family>[] = [
	{
		accessorKey: "family_name",
		header: "Nombre de la Familia",
	},
	{
		accessorKey: "head_of_household_id",
		header: "ID Jefe de Hogar",
	},
	{
		accessorKey: "house_id",
		header: "ID Casa",
	},
];
