import { paginationSchema } from "@/shared/dto/pagination.dto";
import * as z from "zod";

export const citizenQueryDto = z.object({
  search: z.string().optional(),
  family_id: z.string().optional(),
  user_id: z.string().optional(),
  mine: z.enum(["true", "false"]).optional().default("false"),
}).merge(paginationSchema);

export type CitizenQueryParams = z.infer<typeof citizenQueryDto>;
