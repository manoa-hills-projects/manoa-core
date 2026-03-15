import * as schema from "@/shared/database/schemas";
import { DrizzleD1Database } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import type { SignatoryRole } from "@/shared/database/schemas";

export const getAllSignatories = async (db: DrizzleD1Database<typeof schema>) => {
    const rows = await db.select().from(schema.councilSignatories);
    return rows;
};

export const updateSignatory = async (
    db: DrizzleD1Database<typeof schema>,
    role: SignatoryRole,
    data: { name: string; idNumber: string; signatureImage?: string | null },
) => {
    const [updated] = await db
        .update(schema.councilSignatories)
        .set({
            name: data.name,
            idNumber: data.idNumber,
            ...(data.signatureImage !== undefined
                ? { signatureImage: data.signatureImage }
                : {}),
        })
        .where(eq(schema.councilSignatories.role, role))
        .returning();
    return updated ?? null;
};
