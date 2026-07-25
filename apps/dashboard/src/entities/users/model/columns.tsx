import type { ColumnDef } from "@tanstack/react-table";
import type { User } from "./types";

const profileMap: Record<string, string> = {
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
		id: "profile",
		accessorKey: "role",
		header: "Perfil",
		cell: ({ row }) => {
			const role = row.original.role || "user";
			return profileMap[role] || role;
		},
	},
	{
		accessorKey: "banned",
		header: "Estado",
		cell: ({ row }) => (row.original.banned ? "Suspendido" : "Activo"),
	},
];
