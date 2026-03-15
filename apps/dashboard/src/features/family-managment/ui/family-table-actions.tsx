import { Eye, Pencil, Trash } from "lucide-react";
import { useMemo } from "react";
import { type Family, familiesConfig } from "@/entities/families";
import {
	type ActionItem,
	DataTableActions,
} from "@/shared/ui/data-table-actions";

interface FamilyTableActionsProps {
	family: Family;
	onView: (family: Family) => void;
	onEdit: (family: Family) => void;
	onDelete: (family: Family) => void;
}

export const FamilyTableActions = ({
	family,
	onView,
	onEdit,
	onDelete,
}: FamilyTableActionsProps) => {
	const actions = useMemo<ActionItem<Family>[]>(
		() => [
			{
				label: "Ver detalles",
				icon: Eye,
				onClick: onView,
			},
			{
				label: familiesConfig.buttons.edit,
				icon: Pencil,
				onClick: onEdit,
			},
			{
				label: "Eliminar",
				icon: Trash,
				onClick: onDelete,
				className: "text-red-600 focus:bg-red-50 focus:text-red-600",
			},
		],
		[onView, onEdit, onDelete],
	);

	return (
		<DataTableActions
			data={family}
			actions={actions}
			label="Acciones de Familia"
		/>
	);
};
