import type { ColumnDef } from "@tanstack/react-table";
import { Home, Phone, Star, Users } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import type { Family } from "./types";

export const familyColumns: ColumnDef<Family>[] = [
	{
		accessorKey: "family_name",
		header: () => (
			<div className="flex flex-row items-center gap-1">
				<Users className="size-3.5" /> Nombre de la Familia
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
		accessorKey: "head_of_household_label",
		header: () => (
			<div className="flex flex-row items-center gap-1">
				<Star className="size-3.5" /> Jefe de Hogar
			</div>
		),
		cell: ({ row }) => {
			const label =
				row.original.head_of_household_label ||
				row.original.head_of_household_id ||
				"-";

			return (
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="max-w-[200px]">
							<Badge
								variant="secondary"
								className="w-full block truncate text-left"
							>
								{label}
							</Badge>
						</div>
					</TooltipTrigger>
					<TooltipContent>
						<p>{label}</p>
					</TooltipContent>
				</Tooltip>
			);
		},
	},
	{
		accessorKey: "house_label",
		header: () => (
			<div className="flex flex-row items-center gap-1">
				<Home className="size-3.5" /> Vivienda
			</div>
		),
		cell: ({ row }) => {
			const label = row.original.house_label || row.original.house_id;

			return (
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="max-w-[200px]">
							<Badge
								variant="outline"
								className="w-full block truncate text-left"
							>
								{label}
							</Badge>
						</div>
					</TooltipTrigger>
					<TooltipContent>
						<p>{label}</p>
					</TooltipContent>
				</Tooltip>
			);
		},
	},
];
