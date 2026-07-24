import type { Citizen } from "./types";
import { formatDocumentId } from "../lib/format-document-id";

export const citizenOptionAdapter = {
	getLabel: (item: Citizen) => {
		const doc = formatDocumentId(item.dni_type, item.cedula);
		return doc ? `${item.names} ${item.surnames} (${doc})` : `${item.names} ${item.surnames}`;
	},
	getValue: (item: Citizen) => item.id,
	renderOption: (item: Citizen) => {
		const doc = formatDocumentId(item.dni_type, item.cedula);
		return doc ? `${item.names} ${item.surnames} - ${doc}` : `${item.names} ${item.surnames}`;
	},
};
