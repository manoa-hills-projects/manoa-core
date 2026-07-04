import { z } from "zod";

const amountString = z
  .string()
  .regex(/^\d+([.,]\d{1,2})?$/, "Monto inválido (usar hasta 2 decimales)");

export const createExpenseDto = z.object({
  categoryId: z.string().min(1),
  description: z.string().min(3).max(500),
  beneficiary: z.string().max(160).optional().nullable(),
  amountBs: amountString,
  amountUsd: amountString,
  /** Fecha del gasto (YYYY-MM-DD). Si se omite, hoy. */
  spentAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const updateExpenseDto = createExpenseDto.partial();

export const listExpensesQueryDto = z.object({
  categoryId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateExpenseInput = z.infer<typeof createExpenseDto>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseDto>;
export type ListExpensesQuery = z.infer<typeof listExpensesQueryDto>;
