import * as z from "zod";

export const createFamilyDto = z.object({
  family_name: z.string().min(2).max(100),
  house_id: z.string().uuid(),
  head_of_household_id: z.string().uuid().optional(),
});

export type createFamilyInput = z.infer<typeof createFamilyDto>;
