import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/shared/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import type { Family } from "./types";

export const familyColumns: ColumnDef<Family>[] = [
	{
		accessorKey: "family_name",
		header: "Nombre de la Familia",
	},
	{
		accessorKey: "head_of_household_label",
		header: "Jefe de Hogar",
		cell: ({ row }) => {
			const label =
				row.original.head_of_household_label ||
				row.original.head_of_household_id ||
				"-";

			return (
				<Tooltip>
					<TooltipTrigger asChild>
						<Badge variant="secondary" className="max-w-60 truncate">
							{label}
						</Badge>
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
		header: "Vivienda",
		cell: ({ row }) => {
			const label = row.original.house_label || row.original.house_id;

			return (
				<Tooltip>
					<TooltipTrigger asChild>
						<Badge variant="outline" className="max-w-60 truncate">
							{label}
						</Badge>
					</TooltipTrigger>
					<TooltipContent>
						<p>{label}</p>
					</TooltipContent>
				</Tooltip>
			);
		},
	},
];
