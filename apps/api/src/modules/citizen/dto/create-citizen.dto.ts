import * as z from "zod";

export const createCitizenDto = z.object({
  dni_type: z.enum(['NATIONAL', 'FOREIGN', 'SYNTHETIC']).default('NATIONAL'),
  cedula: z.string().min(6).max(20),
  phone: z.string().optional().nullable(),
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
  user_id: z.string().optional().nullable(),
  disabilities: z.array(z.object({
    disability_type: z.enum(['visual', 'auditiva', 'fisica', 'intelectual', 'psicosocial', 'multiple', 'otra']),
    description: z.string().optional(),
  })).optional().default([]),
});

export type createCitizenInput = z.infer<typeof createCitizenDto>;
