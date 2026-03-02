import { createCitizenDto } from "./create-citizen.dto";
import type * as z from "zod";

export const updateCitizenDto = createCitizenDto.partial();
export type updateCitizenInput = z.infer<typeof updateCitizenDto>;
