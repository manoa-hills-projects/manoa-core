import { z } from "zod";

export const paginationSchema = z.object({
  page: z.string().optional().transform((val) => Number(val) || 1),
  limit: z.string().optional().transform((val) => Number(val) || 10),
});