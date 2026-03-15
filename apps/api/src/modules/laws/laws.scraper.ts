import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "@/shared/database/schemas";
import { sql } from "drizzle-orm";
import { extractText, getDocumentProxy } from "unpdf";

interface CrawlRecord {
	url: string;
	status: string;
	markdown?: string;
}

interface CrawlJobResult {
	status: string;
	records?: CrawlRecord[];
}

interface ParsedLaw {
	name: string;
	pdfUrl: string;
}

async function pollCrawlJob(
	accountId: string,
	apiToken: string,
	jobId: string,
	maxAttempts = 20,
): Promise<CrawlJobResult> {
	const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/crawl/${jobId}`;

	for (let i = 0; i < maxAttempts; i++) {
		const res = await fetch(`${baseUrl}?limit=1`, {
			headers: { Authorization: `Bearer ${apiToken}` },
		});
		const data = (await res.json()) as { result: CrawlJobResult };
		if (data.result.status !== "running") {
			const fullRes = await fetch(baseUrl, {
				headers: { Authorization: `Bearer ${apiToken}` },
			});
			const fullData = (await fullRes.json()) as { result: CrawlJobResult };
			return fullData.result;
		}
		await new Promise((r) => setTimeout(r, 3000));
	}
	throw new Error("Crawl job did not complete in time");
}

function parseLawLinksFromMarkdown(markdown: string): ParsedLaw[] {
	const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+\.pdf)\)/gi;
	const laws: ParsedLaw[] = [];

	for (const match of markdown.matchAll(linkRegex)) {
		const name = match[1].trim();
		const pdfUrl = match[2].trim();
		if (name && pdfUrl) {
			laws.push({ name, pdfUrl });
		}
	}
	return laws;
}

async function extractPdfText(pdfUrl: string): Promise<string> {
	const response = await fetch(pdfUrl);
	if (!response.ok) {
		throw new Error(`Failed to fetch PDF: ${response.status} ${pdfUrl}`);
	}
	const buffer = await response.arrayBuffer();
	const pdf = await getDocumentProxy(new Uint8Array(buffer));
	const { text } = await extractText(pdf, { mergePages: true });
	return text as string;
}

export async function scrapeAndStoreLaws(
	db: DrizzleD1Database<typeof schema>,
	accountId: string,
	apiToken: string,
): Promise<{ scraped: number; errors: string[] }> {
	const SOURCE_URL = "https://www.comunas.gob.ve/leyes-poder-popular/";
	const errors: string[] = [];

	// Phase 1: crawl the page with Cloudflare Browser Rendering
	const startRes = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/crawl`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				url: SOURCE_URL,
				limit: 1,
				depth: 0,
				formats: ["markdown"],
				render: false,
			}),
		},
	);

	if (!startRes.ok) {
		const errText = await startRes.text();
		throw new Error(`Failed to start crawl job: ${errText}`);
	}

	const startData = (await startRes.json()) as { result: string; success: boolean };
	if (!startData.success) {
		throw new Error("Crawl job creation was not successful");
	}

	const jobId = startData.result;
	const jobResult = await pollCrawlJob(accountId, apiToken, jobId);

	if (jobResult.status !== "completed") {
		throw new Error(`Crawl job ended with status: ${jobResult.status}`);
	}

	const pageRecord = jobResult.records?.find((r) => r.status === "completed");
	if (!pageRecord?.markdown) {
		throw new Error("No markdown content returned from crawl");
	}

	// Phase 2: parse PDF links from markdown
	const parsedLaws = parseLawLinksFromMarkdown(pageRecord.markdown);
	if (parsedLaws.length === 0) {
		throw new Error("No PDF links found on the page");
	}

	// Phase 3: extract text from each PDF and upsert to D1
	let scraped = 0;
	for (const law of parsedLaws) {
		try {
			const fullText = await extractPdfText(law.pdfUrl);
			await db
				.insert(schema.laws)
				.values({
					name: law.name,
					sourceUrl: SOURCE_URL,
					pdfUrl: law.pdfUrl,
					fullText,
					scrapedAt: new Date(),
				})
				.onConflictDoUpdate({
					target: schema.laws.pdfUrl,
					set: {
						name: law.name,
						fullText,
						scrapedAt: new Date(),
						updatedAt: new Date(),
					},
				});
			scraped++;
		} catch (err) {
			errors.push(`${law.name}: ${err instanceof Error ? err.message : String(err)}`);
		}
	}

	return { scraped, errors };
}

export async function searchLawsText(
	db: DrizzleD1Database<typeof schema>,
	query: string,
	limit = 3,
): Promise<Array<{ name: string; excerpt: string; pdfUrl: string }>> {
	const term = `%${query.toLowerCase()}%`;
	const rows = await db
		.select({
			id: schema.laws.id,
			name: schema.laws.name,
			pdfUrl: schema.laws.pdfUrl,
			fullText: schema.laws.fullText,
		})
		.from(schema.laws)
		.where(sql`LOWER(${schema.laws.fullText}) LIKE ${term} OR LOWER(${schema.laws.name}) LIKE ${term}`)
		.limit(limit);

	return rows.map((row) => {
		let excerpt = "";
		if (row.fullText) {
			const idx = row.fullText.toLowerCase().indexOf(query.toLowerCase());
			const start = Math.max(0, idx - 150);
			const end = Math.min(row.fullText.length, idx + 400);
			excerpt = (start > 0 ? "..." : "") + row.fullText.slice(start, end) + (end < row.fullText.length ? "..." : "");
		}
		return { name: row.name, excerpt, pdfUrl: row.pdfUrl };
	});
}
