import { z } from "zod";

export const houseSchema = z.object({
    address: z.string().min(1, "La dirección es requerida"),
    sector: z.string().min(1, "El sector es requerido"),
    number: z.string().min(1, "El número de casa es requerido"),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
});

export type HouseFormValues = z.infer<typeof houseSchema>;