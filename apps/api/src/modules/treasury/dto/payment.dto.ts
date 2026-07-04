import { z } from "zod";

const amountString = z
  .string()
  .regex(/^\d+([.,]\d{1,2})?$/, "Monto inválido (usar hasta 2 decimales)");

/**
 * Campos que llegan por multipart form-data cuando el ciudadano
 * envía un pago. El comprobante llega como parte `receipt` (File).
 */
export const createPaymentDto = z.object({
  conceptId: z.string().min(1).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  amountBs: amountString,
  amountUsd: amountString,
});

export const updatePaymentDto = createPaymentDto.partial();

export const reviewPaymentDto = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("approve"),
    notes: z.string().max(500).optional().nullable(),
  }),
  z.object({
    action: z.literal("reject"),
    notes: z.string().min(3).max(500),
  }),
]);

export const listPaymentsQueryDto = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  conceptId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreatePaymentInput = z.infer<typeof createPaymentDto>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentDto>;
export type ReviewPaymentInput = z.infer<typeof reviewPaymentDto>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsQueryDto>;
