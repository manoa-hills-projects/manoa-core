export interface Law {
	id: string;
	name: string;
	source_url: string;
	pdf_url: string;
	scraped_at: number | null;
	created_at: number;
	full_text?: string | null;
}
