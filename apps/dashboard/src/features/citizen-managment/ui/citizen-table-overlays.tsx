import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import type { Citizen } from "@/entities/citizens";
import { CitizenFormSheet } from "./citizen-form-sheet";
import { CitizenDetailSheet } from "./citizen-detail-sheet";

interface CitizenTableOverlaysProps {
    ui: {
        isDetailOpen: boolean;
        setDetailOpen: (open: boolean) => void;
        isSheetOpen: boolean;
        setSheetOpen: (open: boolean) => void;
        isDeleteDialogOpen: boolean;
        setDeleteOpen: (open: boolean) => void;
        selectedItem: Citizen | null;
    };
    onDeleteConfirm: () => void;
    isDeleting: boolean;
}

export function CitizenTableOverlays({ ui, onDeleteConfirm, isDeleting }: CitizenTableOverlaysProps) {
    return (
        <>
            <CitizenDetailSheet
                open={ui.isDetailOpen}
                onOpenChange={ui.setDetailOpen}
                citizen={ui.selectedItem}
            />
            <CitizenFormSheet
                open={ui.isSheetOpen}
                onOpenChange={ui.setSheetOpen}
                citizen={ui.selectedItem}
            />
            <ConfirmDialog
                open={ui.isDeleteDialogOpen}
                onOpenChange={ui.setDeleteOpen}
                title="Eliminar ciudadano"
                description={`¿Está seguro de eliminar el ciudadano ${ui.selectedItem?.names} ${ui.selectedItem?.surnames}?`}
                onConfirm={onDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}
