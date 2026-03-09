import { z } from "zod";

export const pollFormSchema = z.object({
	title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
	description: z.string().optional(),
	options: z
		.array(
			z.object({
				text: z.string().min(1, "La opción no puede estar vacía"),
			}),
		)
		.min(2, "Debe agregar al menos 2 opciones"),
});

export type PollFormValues = z.infer<typeof pollFormSchema>;
