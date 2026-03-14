import * as schema from "@/shared/database/schemas";
import { DrizzleD1Database } from "drizzle-orm/d1";
import { and, count, desc, eq } from "drizzle-orm";
import { buildPaginatedData, buildSingleData } from "@/shared/utils/api-reponse";
import type { CreateRequestInput } from "./dto/create-request.dto";
import type { ReviewRequestInput } from "./dto/review-request.dto";
import { generateResidencyLetterPdf } from "./requests.pdf";
import type { ResidencyLetterPayload } from "./dto/create-request.dto";

const DEFAULT_LIMIT = 20;

export const createRequest = async (
    db: DrizzleD1Database<typeof schema>,
    userId: string,
    data: CreateRequestInput,
) => {
    const [result] = await db
        .insert(schema.documentRequests)
        .values({
            type: data.type,
            userId,
            payload: JSON.stringify(data.payload),
        })
        .returning();

    return buildSingleData(result ?? null);
};

export const findAllRequests = async (
    db: DrizzleD1Database<typeof schema>,
    options: { page: number; limit: number; userId?: string },
) => {
    const { page, limit, userId } = options;
    const effectiveLimit = limit || DEFAULT_LIMIT;

    const where = userId ? eq(schema.documentRequests.userId, userId) : undefined;

    const [rows, [{ total }]] = await Promise.all([
        db
            .select()
            .from(schema.documentRequests)
            .where(where)
            .orderBy(desc(schema.documentRequests.createdAt))
            .limit(effectiveLimit)
            .offset((page - 1) * effectiveLimit),
        db
            .select({ total: count() })
            .from(schema.documentRequests)
            .where(where),
    ]);

    return buildPaginatedData(rows, total, page, effectiveLimit);
};

export const findOneRequest = async (
    db: DrizzleD1Database<typeof schema>,
    id: string,
) => {
    const result = await db
        .select()
        .from(schema.documentRequests)
        .where(eq(schema.documentRequests.id, id))
        .get();

    return buildSingleData(result ?? null);
};

export const reviewRequest = async (
    db: DrizzleD1Database<typeof schema>,
    id: string,
    reviewerId: string,
    data: ReviewRequestInput,
) => {
    const existing = await db
        .select()
        .from(schema.documentRequests)
        .where(eq(schema.documentRequests.id, id))
        .get();

    if (!existing) {
        return null;
    }

    if (existing.status !== "pending") {
        throw new Error("La solicitud ya fue procesada");
    }

    const [updated] = await db
        .update(schema.documentRequests)
        .set({
            status: data.status,
            rejectionReason: data.status === "rejected" ? data.rejectionReason : null,
            reviewedBy: reviewerId,
            reviewedAt: new Date(),
        })
        .where(eq(schema.documentRequests.id, id))
        .returning();

    return buildSingleData(updated ?? null);
};

export const generateRequestDocument = async (
    db: DrizzleD1Database<typeof schema>,
    id: string,
    requestingUserId: string,
    isAdmin: boolean,
) => {
    const request = await db
        .select()
        .from(schema.documentRequests)
        .where(eq(schema.documentRequests.id, id))
        .get();

    if (!request) throw new Error("Solicitud no encontrada");
    if (!isAdmin && request.userId !== requestingUserId) throw new Error("No autorizado");
    if (request.status !== "approved") throw new Error("La solicitud no ha sido aprobada");
    if (request.type !== "residency_letter") throw new Error("Tipo de documento no soportado");

    const payload = JSON.parse(request.payload) as ResidencyLetterPayload;

    // Fetch signatories for the PDF signature blocks
    const signatories = await db.select().from(schema.councilSignatories);

    const pdfBytes = await generateResidencyLetterPdf(payload, signatories);

    return pdfBytes;
};

