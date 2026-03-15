CREATE TABLE `document_certifications` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()),
	`document_type` text NOT NULL,
	`resident_id` text NOT NULL,
	`hash` text NOT NULL,
	`metadata` text,
	FOREIGN KEY (`resident_id`) REFERENCES `citizens`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `document_certifications_hash_unique` ON `document_certifications` (`hash`);