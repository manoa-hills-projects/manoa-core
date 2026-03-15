import * as z from "zod";

export const residencyLetterPayloadDto = z.object({
    fullName: z.string().min(2).max(150),
    idNumber: z.string().min(5).max(20),
    nationality: z.string().min(2).max(30).default("Venezolano(a)"),
    yearsOfResidence: z.number().int().min(0).max(100),
    streetName: z.string().min(2).max(150),
    houseNumber: z.string().min(1).max(20),
    issueDay: z.number().int().min(1).max(31),
    issueMonth: z.string().min(2).max(20),
});

export const createRequestDto = z.object({
    type: z.enum(["residency_letter"]),
    payload: residencyLetterPayloadDto,
});

export type CreateRequestInput = z.infer<typeof createRequestDto>;
export type ResidencyLetterPayload = z.infer<typeof residencyLetterPayloadDto>;
