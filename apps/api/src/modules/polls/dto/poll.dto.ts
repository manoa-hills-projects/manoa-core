import * as z from "zod";

export const createPollDto = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  options: z.array(z.string().min(1)).min(2, "Una votación debe tener al menos dos opciones"),
});

export type CreatePollInput = z.infer<typeof createPollDto>;

export const updatePollStatusDto = z.object({
  status: z.enum(["open", "closed"]),
});

export type UpdatePollStatusInput = z.infer<typeof updatePollStatusDto>;

export const voteDto = z.object({
  option_id: z.string().uuid(),
});

export type VoteInput = z.infer<typeof voteDto>;

export const pollQueryDto = z.object({
  limit: z.coerce.number().min(1).max(100).default(10),
  page: z.coerce.number().min(1).default(1),
  search: z.string().optional(),
});

export type PollQueryParams = z.infer<typeof pollQueryDto>;