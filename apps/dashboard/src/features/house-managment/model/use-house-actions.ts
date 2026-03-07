import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useDeleteHouse, type House } from "@/entities/houses";

export function useHouseActions() {
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [states, setStates] = useState({
    isSheetOpen: false,
    isDeleteDialogOpen: false,
    isDetailOpen: false,
  });

  const { mutateAsync: deleteHouse, isPending: isDeleting } = useDeleteHouse();

  const openCreate = useCallback(() => {
    setSelectedHouse(null);
    setStates(s => ({ ...s, isSheetOpen: true }));
  }, []);

  const openEdit = useCallback((house: House) => {
    setSelectedHouse(house);
    setStates(s => ({ ...s, isSheetOpen: true }));
  }, []);

  const openDetails = useCallback((house: House) => {
    setSelectedHouse(house);
    setStates(s => ({ ...s, isDetailOpen: true }));
  }, []);

  const openDelete = useCallback((house: House) => {
    setSelectedHouse(house);
    setStates(s => ({ ...s, isDeleteDialogOpen: true }));
  }, []);

  const closeAll = useCallback(() => {
    setStates({ isSheetOpen: false, isDeleteDialogOpen: false, isDetailOpen: false });
  }, []);

  const handleConfirmDelete = async () => {
    if (!selectedHouse) return;
    try {
      await deleteHouse(selectedHouse.id);
      toast.success("Vivienda eliminada correctamente");
      closeAll();
    } catch {
      toast.error("No se pudo eliminar la vivienda");
    }
  };

  return {
    selectedHouse,
    ...states,
    isDeleting,
    openCreate,
    openEdit,
    openDetails,
    openDelete,
    closeAll,
    handleConfirmDelete,
    setSheetOpen: (val: boolean) => setStates(s => ({ ...s, isSheetOpen: val })),
    setDetailOpen: (val: boolean) => setStates(s => ({ ...s, isDetailOpen: val })),
    setDeleteOpen: (val: boolean) => setStates(s => ({ ...s, isDeleteDialogOpen: val })),
  };
}