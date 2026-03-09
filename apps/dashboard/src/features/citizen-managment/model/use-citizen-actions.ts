import { useState, useCallback } from "react";
import { useDeleteCitizen, type Citizen } from "@/entities/citizens";
import { useResourceActions } from "@/shared/hooks/use-resource-actions";

export function useCitizenActions() {
    const { mutateAsync: deleteCitizen } = useDeleteCitizen();
    const resourceActions = useResourceActions<Citizen>(deleteCitizen, "Ciudadano");
    
    const [citizenForLetter, setCitizenForLetter] = useState<Citizen | null>(null);

    const openLetterModal = useCallback((citizen: Citizen) => {
        setCitizenForLetter(citizen);
    }, []);

    const closeLetterModal = useCallback(() => {
        setCitizenForLetter(null);
    }, []);

    return {
        ...resourceActions,
        citizenForLetter,
        openLetterModal,
        closeLetterModal
    };
}
