import { z } from "zod";

export const setRateDto = z.object({
  /** Fecha en formato YYYY-MM-DD. Si se omite, usa hoy (UTC). */
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  /** Tasa Bs por 1 USD, string decimal para preservar precisión. */
  bsPerUsd: z
    .string()
    .regex(/^\d+([.,]\d{1,6})?$/, "Tasa inválida (usar hasta 6 decimales)"),
});

export type SetRateInput = z.infer<typeof setRateDto>;
