import type { DniType } from "../model/types";

/**
 * Formatea el documento de identidad según el tipo de DNI.
 * 
 * NATIONAL → V-12345678
 * FOREIGN  → E-12345678
 * SYNTHETIC → "" (vacío, no tienen documento real)
 */
export function formatDocumentId(
	dni_type?: DniType | string | null,
	dni?: string | null,
): string {
	if (!dni_type || !dni) return "";
	if (dni_type === "SYNTHETIC") return "";
	if (dni_type === "NATIONAL") return `V-${dni}`;
	if (dni_type === "FOREIGN") return `E-${dni}`;
	return dni;
}
