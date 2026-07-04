import { z } from "zod";

export const createCategoryDto = z.object({
  key: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9_]+$/, "Solo minúsculas, números y guión bajo"),
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional().nullable(),
  kind: z.enum(["income", "expense", "both"]).default("both"),
  isActive: z.boolean().default(true),
});

export const updateCategoryDto = createCategoryDto.partial();

export type CreateCategoryInput = z.infer<typeof createCategoryDto>;
export type UpdateCategoryInput = z.infer<typeof updateCategoryDto>;
