import * as z from "zod";

export const reviewRequestDto = z.discriminatedUnion("status", [
    z.object({
        status: z.literal("approved"),
    }),
    z.object({
        status: z.literal("rejected"),
        rejectionReason: z.string().min(5).max(500),
    }),
]);

export type ReviewRequestInput = z.infer<typeof reviewRequestDto>;
