import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { baseColumns } from "./base.schema";

export const laws = sqliteTable("laws", {
	...baseColumns,
	name: text("name").notNull(),
	sourceUrl: text("source_url").notNull(),
	pdfUrl: text("pdf_url").notNull().unique(),
	fullText: text("full_text"),
	scrapedAt: integer("scraped_at", { mode: "timestamp" })
		.default(sql`(unixepoch())`)
		.notNull(),
});
