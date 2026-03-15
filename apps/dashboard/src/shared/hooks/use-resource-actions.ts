import { useCallback, useState } from "react";
import { toast } from "sonner";

interface BaseEntity {
	id: string | number;
}

export function useResourceActions<T extends BaseEntity>(
	deleteMutation: (id: T["id"]) => Promise<any>,
	resourceName: string,
) {
	const [selectedItem, setSelectedItem] = useState<T | null>(null);
	const [states, setStates] = useState({
		isSheetOpen: false,
		isDeleteDialogOpen: false,
		isDetailOpen: false,
	});
	const [isDeleting, setIsDeleting] = useState(false);

	const openCreate = useCallback(() => {
		setSelectedItem(null);
		setStates((s) => ({ ...s, isSheetOpen: true }));
	}, []);

	const openEdit = useCallback((item: T) => {
		setSelectedItem(item);
		setStates((s) => ({ ...s, isSheetOpen: true }));
	}, []);

	const openDetails = useCallback((item: T) => {
		setSelectedItem(item);
		setStates((s) => ({ ...s, isDetailOpen: true }));
	}, []);

	const openDelete = useCallback((item: T) => {
		setSelectedItem(item);
		setStates((s) => ({ ...s, isDeleteDialogOpen: true }));
	}, []);

	const closeAll = useCallback(() => {
		setStates({
			isSheetOpen: false,
			isDeleteDialogOpen: false,
			isDetailOpen: false,
		});
	}, []);

	const handleConfirmDelete = async () => {
		if (!selectedItem) return;
		setIsDeleting(true);
		try {
			await deleteMutation(selectedItem.id);
			toast.success(`${resourceName} eliminado/a correctamente`);
			closeAll();
		} catch {
			toast.error(`No se pudo eliminar el/la ${resourceName.toLowerCase()}`);
		} finally {
			setIsDeleting(false);
		}
	};

	return {
		selectedItem,
		...states,
		isDeleting,
		openCreate,
		openEdit,
		openDetails,
		openDelete,
		closeAll,
		handleConfirmDelete,
		setSheetOpen: (val: boolean) =>
			setStates((s) => ({ ...s, isSheetOpen: val })),
		setDetailOpen: (val: boolean) =>
			setStates((s) => ({ ...s, isDetailOpen: val })),
		setDeleteOpen: (val: boolean) =>
			setStates((s) => ({ ...s, isDeleteDialogOpen: val })),
	};
}
