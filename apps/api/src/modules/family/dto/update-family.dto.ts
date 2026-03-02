import { createFamilyDto } from "./create-family.dto";
import * as z from "zod";

export const updateFamilyDto = createFamilyDto.partial();
export type updateFamilyInput = z.infer<typeof updateFamilyDto>;
