import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth.schema";
import { citizens } from "./censuses.schema";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

export const documentCertifications = sqliteTable("document_certifications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  documentType: text("document_type").notNull(),
  citizenId: text("citizen_id")
    .references(() => citizens.id, { onDelete: "cascade" }),
  hash: text("hash").notNull(),
  issuedAt: text("issued_at")
    .$defaultFn(() => new Date().toISOString()),
  issuedBy: text("issued_by").references(() => user.id),
  status: text("status", { enum: ["VALID", "REVOKED"] })
    .default("VALID")
    .notNull(),
});

export type DocumentCertification = InferSelectModel<typeof documentCertifications>;
export type InsertDocumentCertification = InferInsertModel<typeof documentCertifications>;
