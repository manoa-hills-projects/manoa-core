import { z } from "zod";

const amountString = z
  .string()
  .regex(/^\d+([.,]\d{1,2})?$/, "Monto inválido (usar hasta 2 decimales)");

export const createConceptDto = z.object({
  key: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9_]+$/, "Solo minúsculas, números y guión bajo"),
  name: z.string().min(2).max(160),
  description: z.string().max(500).optional().nullable(),
  categoryId: z.string().min(1),
  defaultAmountBs: amountString.optional().nullable(),
  defaultAmountUsd: amountString.optional().nullable(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateConceptDto = createConceptDto
  .omit({ key: true })
  .partial();

export const listConceptsQueryDto = z.object({
  activeOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v !== "false"),
});

export type CreateConceptInput = z.infer<typeof createConceptDto>;
export type UpdateConceptInput = z.infer<typeof updateConceptDto>;
