import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth.schema";

export const documentRequests = sqliteTable("document_requests", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    type: text("type", { enum: ["residency_letter"] }).notNull(),
    status: text("status", { enum: ["pending", "approved", "rejected"] })
        .default("pending")
        .notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    payload: text("payload").notNull(), // JSON string with form data
    rejectionReason: text("rejection_reason"),
    reviewedBy: text("reviewed_by").references(() => user.id, {
        onDelete: "set null",
    }),
    reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
        .default(sql`(unixepoch())`)
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .default(sql`(unixepoch())`)
        .$onUpdate(() => new Date()),
});

export const documentRequestsRelations = relations(
    documentRequests,
    ({ one }) => ({
        requester: one(user, {
            fields: [documentRequests.userId],
            references: [user.id],
            relationName: "requester",
        }),
        reviewer: one(user, {
            fields: [documentRequests.reviewedBy],
            references: [user.id],
            relationName: "reviewer",
        }),
    }),
);

export type DocumentRequest = typeof documentRequests.$inferSelect;
export type NewDocumentRequest = typeof documentRequests.$inferInsert;
