import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { createDocument, type CreateDocumentPayload, type DocumentResponse } from "../api/documents.api";

export const useCreateDocument = () => {
	return useMutation<{ data: DocumentResponse }, Error, CreateDocumentPayload>({
		mutationFn: (data) => createDocument(data),
		onSuccess: () => {
			toast.success("Documento emitido exitosamente");
		},
		onError: (error) => {
			toast.error(`Error al emitir: ${error.message}`);
		},
	});
};
