import { useCallback, useState } from "react";
import { type Citizen, useDeleteCitizen } from "@/entities/citizens";
import { api } from "@/shared/api/api-client";
import { useResourceActions } from "@/shared/hooks/use-resource-actions";

export function useCitizenActions() {
	const { mutateAsync: deleteCitizen } = useDeleteCitizen();
	const resourceActions = useResourceActions<Citizen>(
		deleteCitizen,
		"Ciudadano",
	);

	const [citizenForLetter, setCitizenForLetter] = useState<Citizen | null>(
		null,
	);

	const openLetterModal = useCallback((citizen: Citizen) => {
		setCitizenForLetter(citizen);
	}, []);

	const closeLetterModal = useCallback(() => {
		setCitizenForLetter(null);
	}, []);

	const openEdit = useCallback(async (citizen: Citizen) => {
		try {
			const res = await api.get(`citizens/${citizen.id}`).json<{ data: Citizen }>();
			resourceActions.openEdit(res.data);
		} catch {
			resourceActions.openEdit(citizen);
		}
	}, [resourceActions]);

	return {
		...resourceActions,
		citizenForLetter,
		openLetterModal,
		closeLetterModal,
		openEdit,
	};
}
