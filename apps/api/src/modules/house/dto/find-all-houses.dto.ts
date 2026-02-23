import { paginationSchema } from "@/shared/dto/pagination.dto";
import { z } from "zod";

export const houseQueryDto = paginationSchema.extend({
  search: z.string().optional(),
});

export type HouseQueryParams = z.infer<typeof houseQueryDto>;