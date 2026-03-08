import { useDeleteCitizen, type Citizen } from "@/entities/citizens";
import { useResourceActions } from "@/shared/hooks/use-resource-actions";

export function useCitizenActions() {
    const { mutateAsync: deleteCitizen } = useDeleteCitizen();

    return useResourceActions<Citizen>(deleteCitizen, "Ciudadano");
}
