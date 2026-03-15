import { paginationSchema } from "@/shared/dto/pagination.dto";
import { z } from "zod";

export const lawsQueryDto = z.object({
	search: z.string().optional(),
}).merge(paginationSchema);

export const lawsSearchDto = z.object({
	q: z.string().min(1, "El termino de busqueda no puede estar vacio"),
});

export type LawsQueryParams = z.infer<typeof lawsQueryDto>;
export type LawsSearchParams = z.infer<typeof lawsSearchDto>;
