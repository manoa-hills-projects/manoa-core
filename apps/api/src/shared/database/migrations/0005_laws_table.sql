CREATE TABLE `laws` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`source_url` text NOT NULL,
	`pdf_url` text NOT NULL,
	`full_text` text,
	`scraped_at` integer DEFAULT (unixepoch()) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `laws_pdf_url_unique` ON `laws` (`pdf_url`);
