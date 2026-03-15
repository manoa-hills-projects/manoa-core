import { z } from "zod";

export const createDocumentSchema = z.object({
  documentType: z.string().min(1),
  citizenId: z.string().min(1),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
