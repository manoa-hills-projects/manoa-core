import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/api-client";
import type { CouncilSignatory, SignatoryRole } from "./types";

export const signatoryKeys = {
	all: ["signatories"] as const,
	list: () => [...signatoryKeys.all, "list"] as const,
};

export const useSignatories = () =>
	useQuery({
		queryKey: signatoryKeys.list(),
		queryFn: () => api.get("signatories").json<{ data: CouncilSignatory[] }>(),
	});

export interface UpdateSignatoryPayload {
	name: string;
	idNumber: string;
	/** Pass a File to upload a new image, null to clear, undefined to leave unchanged */
	signatureImage?: File | null;
}

export const useUpdateSignatory = (role: SignatoryRole) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: UpdateSignatoryPayload) => {
			const form = new FormData();
			form.append("name", data.name);
			form.append("idNumber", data.idNumber);

			if (data.signatureImage instanceof File) {
				form.append("signatureImage", data.signatureImage);
			} else if (data.signatureImage === null) {
				form.append("clearSignature", "1");
			}

			return api
				.put(`signatories/${role}`, { body: form })
				.json<{ data: CouncilSignatory }>();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: signatoryKeys.list() });
		},
	});
};
