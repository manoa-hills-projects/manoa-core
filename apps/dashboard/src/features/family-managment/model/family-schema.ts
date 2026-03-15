import { z } from "zod";

export const familySchema = z.object({
	family_name: z.string().min(1, { message: "Requerido" }),
	house_id: z.string().min(1, { message: "Requerido" }),
});

export type FamilyFormValues = z.infer<typeof familySchema>;
