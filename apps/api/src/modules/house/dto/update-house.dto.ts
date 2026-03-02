import { createHouseDto } from "./create-house.dto";
import * as z from "zod";

export const updateHouseDto = createHouseDto.partial();
export type updateHouseInput = z.infer<typeof updateHouseDto>;
