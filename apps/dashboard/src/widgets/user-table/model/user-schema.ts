import { z } from "zod";

export const userFormSchema = z.object({
	name: z.string().min(1, { message: "Requerido" }),
	email: z.string().email({ message: "Correo inválido" }),
	profile_id: z.string().optional(),
	citizen_id: z.string().optional(),
	password: z.string().optional(),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
