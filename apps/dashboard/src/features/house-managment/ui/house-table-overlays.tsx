import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { HouseDetailSheet } from "@/widgets/house-detail-sheet";
import { HouseFormSheet } from "./house-form-sheet";
import type { House } from "@/entities/houses";

interface HouseTableOverlaysProps {
	ui: {
		isDetailOpen: boolean;
		setDetailOpen: (open: boolean) => void;
		isSheetOpen: boolean;
		setSheetOpen: (open: boolean) => void;
		isDeleteDialogOpen: boolean;
		setDeleteOpen: (open: boolean) => void;
		selectedHouse: House | null;
	};
	onDeleteConfirm: () => void;
	isDeleting: boolean;
}

export function HouseTableOverlays({ ui, onDeleteConfirm, isDeleting }: HouseTableOverlaysProps) {
	return (
		<>
			<HouseDetailSheet
				open={ui.isDetailOpen}
				onOpenChange={ui.setDetailOpen}
				house={ui.selectedHouse}
			/>
			<HouseFormSheet
				open={ui.isSheetOpen}
				onOpenChange={ui.setSheetOpen}
				house={ui.selectedHouse}
			/>
			<ConfirmDialog
				open={ui.isDeleteDialogOpen}
				onOpenChange={ui.setDeleteOpen}
				title="Eliminar vivienda"
				description={`¿Está seguro de eliminar la vivienda ${ui.selectedHouse?.number}, sector ${ui.selectedHouse?.sector}?`}
				onConfirm={onDeleteConfirm}
				isLoading={isDeleting}
			/>
		</>
	);
}
