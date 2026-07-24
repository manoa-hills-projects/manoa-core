import { z } from "zod";

export const familySchema = z.object({
	family_name: z.string().min(1, { message: "Requerido" }),
	house_id: z.string().min(1, { message: "Requerido" }),
	phone: z.string().optional(),
	observations: z.string().optional(),
});

export type FamilyFormValues = z.infer<typeof familySchema>;
