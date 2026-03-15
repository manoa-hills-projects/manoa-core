import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "@/shared/database/schemas";
import { eq, count, sql } from "drizzle-orm";
import { buildPaginatedData, buildSingleData } from "@/shared/utils/api-reponse";
import type { LawsQueryParams } from "./dto";
import { scrapeAndStoreLaws, searchLawsText } from "./laws.scraper";

const toLawResponse = (law: typeof schema.laws.$inferSelect, includeFullText = false) => ({
	id: law.id,
	name: law.name,
	source_url: law.sourceUrl,
	pdf_url: law.pdfUrl,
	scraped_at: law.scrapedAt,
	created_at: law.createdAt,
	...(includeFullText ? { full_text: law.fullText } : {}),
});

export const findAllLaws = async (
	db: DrizzleD1Database<typeof schema>,
	queryParams: LawsQueryParams,
) => {
	const { limit, page, search } = queryParams;

	const baseQuery = db
		.select({
			id: schema.laws.id,
			name: schema.laws.name,
			sourceUrl: schema.laws.sourceUrl,
			pdfUrl: schema.laws.pdfUrl,
			scrapedAt: schema.laws.scrapedAt,
			createdAt: schema.laws.createdAt,
			updatedAt: schema.laws.updatedAt,
			fullText: schema.laws.fullText,
		})
		.from(schema.laws);

	if (search) {
		baseQuery.where(
			sql`LOWER(${schema.laws.name}) LIKE ${`%${search.toLowerCase()}%`}`,
		);
	}

	const [rows, [{ total }]] = await Promise.all([
		baseQuery.limit(limit).offset((page - 1) * limit),
		db.select({ total: count() }).from(schema.laws),
	]);

	return buildPaginatedData(rows.map((r) => toLawResponse(r)), total, page, limit);
};

export const findOneLaw = async (
	db: DrizzleD1Database<typeof schema>,
	id: string,
) => {
	const result = await db.select().from(schema.laws).where(eq(schema.laws.id, id)).get();
	return buildSingleData(result ? toLawResponse(result, true) : null);
};

export const triggerScrape = async (
	db: DrizzleD1Database<typeof schema>,
	accountId: string,
	apiToken: string,
) => {
	const { scraped, errors } = await scrapeAndStoreLaws(db, accountId, apiToken);
	return {
		message: `Sincronizacion completada. ${scraped} leyes procesadas.`,
		scraped,
		errors,
	};
};

export const searchLaws = async (
	db: DrizzleD1Database<typeof schema>,
	query: string,
) => {
	const results = await searchLawsText(db, query);
	return buildSingleData(results);
};
