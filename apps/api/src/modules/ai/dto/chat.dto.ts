import { z } from "zod";

export const chatDto = z.object({
    conversationId: z.string().optional(),
    message: z.string().min(1, "El mensaje no puede estar vacío"),
});

export type ChatInput = z.infer<typeof chatDto>;
