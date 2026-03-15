import { z } from "zod";

export const citizenSchema = z.object({
	cedula: z.string().min(1, { message: "Requerido" }),
	names: z.string().min(1, { message: "Requerido" }),
	surnames: z.string().min(1, { message: "Requerido" }),
	gender: z.string().min(1, { message: "Requerido" }),
	birth_date: z.string().min(1, { message: "Requerido" }),
	is_head_of_household: z.boolean(),
	family_id: z.string().optional(),
});

export type CitizenFormValues = z.infer<typeof citizenSchema>;
