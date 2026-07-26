import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "@/shared/database/schemas";
import { eq, sql } from "drizzle-orm";
import { extractText, getDocumentProxy } from "unpdf";

async function extractPdfText(pdfUrl: string): Promise<string> {
	const response = await fetch(pdfUrl, {
		headers: { "User-Agent": "Mozilla/5.0 (compatible; ManoaBot/1.0)" },
	});
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
  ai: { run: (model: string, input: unknown) => Promise<unknown> } | undefined,
): Promise<{ scraped: number; errors: string[] }> {
	const errors: string[] = [];

	// Obtener todas las leyes que ya tenemos en DB con sus PDF URLs
	const laws = await db
		.select({ id: schema.laws.id, name: schema.laws.name, pdfUrl: schema.laws.pdfUrl })
		.from(schema.laws)
		.all();

	if (laws.length === 0) {
		throw new Error("No hay leyes en la base de datos. Ejecute primero la inserción manual.");
	}

	console.log(`[laws-scraper] Procesando ${laws.length} leyes...`);

	let scraped = 0;
	for (const law of laws) {
		try {
			console.log(`[laws-scraper] Descargando PDF: ${law.name}`);
			const rawText = await extractPdfText(law.pdfUrl);

			// Generar resumen con IA si está disponible
			let summary = rawText;
			if (ai) {
				try {
					const result = await ai.run("@cf/meta/llama-3.2-3b-instruct", {
						messages: [{
							role: "user",
							content: `Resume en 2-3 párrafos esta ley venezolana de manera clara y simple para que un ciudadano común entienda de qué trata. Usa español. Texto:\n\n${rawText.slice(0, 5000)}`,
						}],
					});
					summary = (result as any)?.response || rawText.slice(0, 2000);
				} catch {
					summary = rawText.slice(0, 2000);
				}
			} else {
				summary = rawText.slice(0, 2000);
			}

			await db
				.update(schema.laws)
				.set({
					fullText: summary,
					scrapedAt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(schema.laws.id, law.id))
				.run();

			// Actualizar el índice FTS5
			await db.run(sql`INSERT INTO laws_fts(laws_fts, name, full_text) VALUES('delete', ${law.name}, ${summary})`);
			await db.run(sql`INSERT INTO laws_fts(name, full_text) VALUES(${law.name}, ${summary})`);

			scraped++;
			console.log(`[laws-scraper] ✅ ${law.name} resumido (${summary.length} caracteres)`);
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			console.error(`[laws-scraper] ❌ ${law.name}: ${msg}`);
			errors.push(`${law.name}: ${msg}`);
		}
	}

	return { scraped, errors };
}

export async function searchLawsText(
  db: DrizzleD1Database<typeof schema>,
  query: string,
  limit = 3,
): Promise<Array<{ name: string; excerpt: string; pdfUrl: string }>> {
  // Escape FTS5 special characters
  const sanitized = query.replace(/['"*()]/g, '').trim();
  if (!sanitized) return [];

  try {
    const rows = await db.all<{
      name: string;
      pdf_url: string;
      full_text: string;
    }>(
      sql`SELECT name, pdf_url, full_text FROM laws_fts WHERE laws_fts MATCH ${sanitized} ORDER BY rank LIMIT ${limit}`
    );

    return rows.map((row: any) => {
      let excerpt = "";
      if (row.full_text) {
        const idx = row.full_text.toLowerCase().indexOf(sanitized.toLowerCase());
        const start = Math.max(0, idx - 150);
        const end = Math.min(row.full_text.length, idx + 400);
        excerpt = (start > 0 ? "..." : "") + row.full_text.slice(start, end) + (end < row.full_text.length ? "..." : "");
      }
      return { name: row.name, excerpt, pdfUrl: row.pdf_url };
    });
  } catch {
    // Fallback a LIKE si FTS5 falla
    const term = `%${sanitized.toLowerCase()}%`;
    const rows = await db
      .select({
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
        const idx = row.fullText.toLowerCase().indexOf(sanitized.toLowerCase());
        const start = Math.max(0, idx - 150);
        const end = Math.min(row.fullText.length, idx + 400);
        excerpt = (start > 0 ? "..." : "") + row.fullText.slice(start, end) + (end < row.fullText.length ? "..." : "");
      }
      return { name: row.name, excerpt, pdfUrl: row.pdfUrl };
    });
  }
}
