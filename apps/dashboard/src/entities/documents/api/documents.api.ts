import { api } from "@/shared/api/api-client";

export interface CreateDocumentPayload {
	documentType: string;
	citizenId: string;
}

export interface DocumentResponse {
	id: string;
	documentType: string;
	citizenId: string;
	hash: string;
	issuedAt: string;
	issuedBy: string;
	status: string;
}

export const createDocument = async (
	payload: CreateDocumentPayload,
): Promise<{ data: DocumentResponse }> => {
	const response = await api.post("documents", {
		json: payload,
	});

	if (!response.ok) {
		throw new Error("Error al emitir el documento");
	}

	return response.json();
};
