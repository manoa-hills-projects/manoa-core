import { type LucideIcon, MoreHorizontal } from "lucide-react";
import { useId } from "react";
import { Button } from "./button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "./dropdown-menu";

export interface ActionItem<T> {
	label: string;
	icon?: LucideIcon;
	onClick: (data: T) => void;
	className?: string;
	show?: (data: T) => boolean;
}

type DataTableActionsProps<T> = {
	data: T;
	actions: ActionItem<T>[];
	label?: string;
};

export const DataTableActions = <T,>({
	data,
	actions,
	label = "Acciones",
}: DataTableActionsProps<T>) => {
	const menuLabelId = useId();
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="h-8 w-8 p-0">
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" aria-labelledby={menuLabelId}>
				{label && <DropdownMenuLabel id={menuLabelId}>{label}</DropdownMenuLabel>}
				{actions.map((action) => {
					if (action.show && !action.show(data)) return null;

					const Icon = action.icon;

					return (
						<DropdownMenuItem
							key={action.label}
							onClick={() => action.onClick(data)}
							className={action.className}
						>
							{Icon && <Icon className="mr-2 h-4 w-4" />}
							{action.label}
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};