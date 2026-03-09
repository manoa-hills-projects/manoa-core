import { z } from "zod";

export const userFormSchema = z
	.object({
		name: z.string().min(1, { message: "Requerido" }),
		email: z.string().email({ message: "Correo inválido" }),
		role: z.string().min(1, { message: "Requerido" }),
		citizen_id: z.string().optional(),
		password: z.string().optional(),
	})
	.refine(
		(data) => {
			// Si no hay un ciudadano seleccionado, la contraseña es obligatoria en creación
			if (!data.citizen_id && !data.password) {
				return false;
			}
			return true;
		},
		{
			message: "Se requiere contraseña o asociar a un ciudadano",
			path: ["password"],
		},
	);

export type UserFormValues = z.infer<typeof userFormSchema>;
