import type { ColumnDef } from "@tanstack/react-table";
import type { User } from "./types";

const roleMap: Record<string, string> = {
	admin: "Administrador",
	superadmin: "Súper Admin",
	user: "Habitante",
};

export const userColumns: ColumnDef<User>[] = [
	{
		accessorKey: "name",
		header: "Nombre",
	},
	{
		accessorKey: "email",
		header: "Correo Electrónico",
	},
	{
		accessorKey: "role",
		header: "Rol",
		cell: ({ row }) => {
			const role = row.original.role || "user";
			return roleMap[role] || role;
		},
	},
	{
		accessorKey: "banned",
		header: "Estado",
		cell: ({ row }) => (row.original.banned ? "Suspendido" : "Activo"),
	},
];
