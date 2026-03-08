import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import type { Family } from "@/entities/families";
import { FamilyFormSheet } from "./family-form-sheet";
import { FamilyDetailSheet } from "./family-detail-sheet";

interface FamilyTableOverlaysProps {
  ui: {
    isDetailOpen: boolean;
    setDetailOpen: (open: boolean) => void;
    isSheetOpen: boolean;
    setSheetOpen: (open: boolean) => void;
    isDeleteDialogOpen: boolean;
    setDeleteOpen: (open: boolean) => void;
    selectedItem: Family | null;
  };
  onDeleteConfirm: () => void;
  isDeleting: boolean;
}

export function FamilyTableOverlays({ ui, onDeleteConfirm, isDeleting }: FamilyTableOverlaysProps) {
  return (
    <>
      <FamilyDetailSheet
        open={ui.isDetailOpen}
        onOpenChange={ui.setDetailOpen}
        family={ui.selectedItem}
      />
      <FamilyFormSheet
        open={ui.isSheetOpen}
        onOpenChange={ui.setSheetOpen}
        family={ui.selectedItem}
      />
      <ConfirmDialog
        open={ui.isDeleteDialogOpen}
        onOpenChange={ui.setDeleteOpen}
        title="Eliminar familia"
        description={`¿Está seguro de eliminar la familia ${ui.selectedItem?.family_name}?`}
        onConfirm={onDeleteConfirm}
        isLoading={isDeleting}
      />
    </>
  );
}
