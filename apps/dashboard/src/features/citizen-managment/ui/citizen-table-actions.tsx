import { Eye, FileDown, Pencil, Trash } from "lucide-react";
import { useMemo } from "react";
import type { Citizen } from "@/entities/citizens";
import {
	type ActionItem,
	DataTableActions,
} from "@/shared/ui/data-table-actions";

interface CitizenTableActionsProps {
	citizen: Citizen;
	onView: (citizen: Citizen) => void;
	onEdit: (citizen: Citizen) => void;
	onDelete: (citizen: Citizen) => void;
	onDownloadLetter: (citizen: Citizen) => void;
}

export const CitizenTableActions = ({
	citizen,
	onView,
	onEdit,
	onDelete,
	onDownloadLetter,
}: CitizenTableActionsProps) => {
	const actions = useMemo<ActionItem<Citizen>[]>(
		() => [
			{
				label: "Ver detalles",
				icon: Eye,
				onClick: onView,
			},
			{
				label: "Editar",
				icon: Pencil,
				onClick: onEdit,
			},
			{
				label: "Eliminar",
				icon: Trash,
				onClick: onDelete,
				className: "text-red-600 focus:bg-red-50 focus:text-red-600",
			},
			{
				label: "Carta de Residencia",
				icon: FileDown,
				onClick: onDownloadLetter,
			},
		],
		[onView, onEdit, onDelete, onDownloadLetter],
	);

	return (
		<DataTableActions
			data={citizen}
			actions={actions}
			label="Acciones de Ciudadano"
		/>
	);
};
