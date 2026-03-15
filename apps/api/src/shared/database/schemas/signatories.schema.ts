import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const SIGNATORY_ROLES = [
    "vocero_electoral",
    "vocero_contraloria",
    "testigo_1",
    "testigo_2",
] as const;

export type SignatoryRole = (typeof SIGNATORY_ROLES)[number];

export const SIGNATORY_ROLE_LABELS: Record<SignatoryRole, string> = {
    vocero_electoral: "Vocero de Unidad Electoral",
    vocero_contraloria: "Vocero de Contraloría",
    testigo_1: "Testigo 1",
    testigo_2: "Testigo 2",
};

export const councilSignatories = sqliteTable("council_signatories", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    role: text("role", {
        enum: ["vocero_electoral", "vocero_contraloria", "testigo_1", "testigo_2"],
    })
        .notNull()
        .unique(),
    name: text("name").notNull().default(""),
    idNumber: text("id_number").notNull().default(""),
    signatureImage: text("signature_image"),
    createdAt: integer("created_at", { mode: "timestamp" })
        .default(sql`(unixepoch())`)
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .default(sql`(unixepoch())`)
        .$onUpdate(() => new Date()),
});

export type CouncilSignatory = typeof councilSignatories.$inferSelect;
