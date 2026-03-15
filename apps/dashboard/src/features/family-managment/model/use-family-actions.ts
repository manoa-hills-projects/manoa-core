import { type Family, useDeleteFamily } from "@/entities/families";
import { useResourceActions } from "@/shared/hooks/use-resource-actions";

export function useFamilyActions() {
	const { mutateAsync: deleteFamily } = useDeleteFamily();

	return useResourceActions<Family>(deleteFamily, "Familia");
}
