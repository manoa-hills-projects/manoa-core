CREATE TABLE `document_certifications` (
	`id` text PRIMARY KEY NOT NULL,
	`document_type` text NOT NULL,
	`citizen_id` text,
	`hash` text NOT NULL,
	`issued_at` text,
	`issued_by` text,
	`status` text DEFAULT 'VALID' NOT NULL,
	FOREIGN KEY (`citizen_id`) REFERENCES `citizens`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`issued_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
