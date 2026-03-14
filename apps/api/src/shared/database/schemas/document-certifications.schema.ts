import { relations, sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { baseColumns } from "./base.schema";
import { citizens } from "./censuses.schema";

export const documentCertifications = sqliteTable("document_certifications", {
	...baseColumns,
	documentType: text("document_type").notNull(),
	residentId: text("resident_id")
		.notNull()
		.references(() => citizens.id, { onDelete: "cascade" }),
	hash: text("hash").notNull().unique(),
	metadata: text("metadata", { mode: "json" }), // Store JSON stringified metadata
});

export const documentCertificationsRelations = relations(
	documentCertifications,
	({ one }) => ({
		resident: one(citizens, {
			fields: [documentCertifications.residentId],
			references: [citizens.id],
		}),
	}),
);

export const citizensDocumentCertificationsRelations = relations(
	citizens,
	({ many }) => ({
		certifications: many(documentCertifications),
	}),
);
