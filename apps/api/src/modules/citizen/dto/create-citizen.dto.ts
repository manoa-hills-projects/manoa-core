import * as z from "zod";

export const createCitizenDto = z.object({
  cedula: z.string().min(6).max(20),
  names: z.string().min(2).max(100),
  surnames: z.string().min(2).max(100),
  gender: z.string().min(1).max(20),
  birth_date: z.string().min(1),
  is_head_of_household: z
    .union([z.boolean(), z.number()])
    .optional()
    .transform((v) => Boolean(v)),
  family_id: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.string().uuid().nullable()),
});

export type createCitizenInput = z.infer<typeof createCitizenDto>;
