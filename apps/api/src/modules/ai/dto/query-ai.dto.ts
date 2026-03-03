import { z } from "zod";

export const queryAiDto = z.object({
  question: z
    .string()
    .min(3, "La pregunta debe tener al menos 3 caracteres")
    .max(1000, "La pregunta es demasiado larga"),
});

export type QueryAiInput = z.infer<typeof queryAiDto>;
