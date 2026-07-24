import { z } from "zod";

export const disabilitySchema = z.object({
	disability_type: z.string().min(1, { message: "Seleccione tipo" }),
	description: z.string().optional(),
});

export const citizenSchema = z.object({
	dni_type: z.enum(["NATIONAL", "FOREIGN", "SYNTHETIC"]),
	cedula: z.string().min(1, { message: "Requerido" }),
	phone: z.string().optional(),
	names: z.string().min(1, { message: "Requerido" }),
	surnames: z.string().min(1, { message: "Requerido" }),
	gender: z.string().min(1, { message: "Requerido" }),
	birth_date: z.string().min(1, { message: "Requerido" }),
	family_id: z.string().optional(),
	disabilities: z.array(disabilitySchema).optional().default([]),
});

export type CitizenFormValues = z.infer<typeof citizenSchema>;
export type DisabilityFormValues = z.infer<typeof disabilitySchema>;
