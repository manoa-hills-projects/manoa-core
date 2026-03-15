import { Eye, Pencil, Trash } from "lucide-react";
import { useMemo } from "react";
import { type House, housesConfig } from "@/entities/houses";
import {
	type ActionItem,
	DataTableActions,
} from "@/shared/ui/data-table-actions";

interface HouseTableActionsProps {
	house: House;
	onView: (house: House) => void;
	onEdit: (house: House) => void;
	onDelete: (house: House) => void;
}

export const HouseTableActions = ({
	house,
	onView,
	onEdit,
	onDelete,
}: HouseTableActionsProps) => {
	const actions = useMemo<ActionItem<House>[]>(
		() => [
			{
				label: "Ver detalles",
				icon: Eye,
				onClick: onView,
			},
			{
				label: housesConfig.buttons.edit,
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
			data={house}
			actions={actions}
			label="Acciones de Vivienda"
		/>
	);
};
