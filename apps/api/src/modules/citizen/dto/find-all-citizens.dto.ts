import { paginationSchema } from "@/shared/dto/pagination.dto";
import * as z from "zod";

export const citizenQueryDto = z.object({
  search: z.string().optional(),
}).merge(paginationSchema);

export type CitizenQueryParams = z.infer<typeof citizenQueryDto>;
