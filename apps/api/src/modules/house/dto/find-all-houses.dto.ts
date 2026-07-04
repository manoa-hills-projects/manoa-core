import { paginationSchema } from "@/shared/dto/pagination.dto";
import { z } from "zod";

export const houseQueryDto = paginationSchema.extend({
  search: z.string().optional(),
  mine: z.enum(["true", "false"]).optional().default("false"),
});

export type HouseQueryParams = z.infer<typeof houseQueryDto>;