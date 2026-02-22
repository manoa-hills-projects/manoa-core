import * as z from "zod";

export const createHouseDto = z.object({
  address: z.string().min(2).max(100),
  sector: z.string().min(2).max(100),
  number: z.string().min(1).max(100)
});

export type createHouseInput = z.infer<typeof createHouseDto>;