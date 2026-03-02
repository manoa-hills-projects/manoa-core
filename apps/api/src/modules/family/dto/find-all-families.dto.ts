import { paginationSchema } from "@/shared/dto/pagination.dto";
import * as z from "zod";

export const familyQueryDto = z.object({
  search: z.string().optional(),
}).merge(paginationSchema);

export type FamilyQueryParams = z.infer<typeof familyQueryDto>;
