import { z } from "zod";

export const houseSchema = z.object({
	address: z
		.string()
		.min(2, "La dirección debe tener al menos 2 caracteres")
		.max(100, "La dirección no puede exceder 100 caracteres"),
	sector: z
		.string()
		.min(2, "El sector debe tener al menos 2 caracteres")
		.max(100, "El sector no puede exceder 100 caracteres"),
	number: z
		.string()
		.min(1, "El número de casa es requerido")
		.max(100, "El número de casa no puede exceder 100 caracteres"),
});

export type HouseFormValues = z.infer<typeof houseSchema>;
