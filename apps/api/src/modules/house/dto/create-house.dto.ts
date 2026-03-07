import * as z from "zod";


export const createHouseDto = z.object({
  address: z.string().min(2).max(100),
  sector: z.string().min(2).max(100),
  number: z.string().min(1).max(100),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type createHouseInput = z.infer<typeof createHouseDto>;