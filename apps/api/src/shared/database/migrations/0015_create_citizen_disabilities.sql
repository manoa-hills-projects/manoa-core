CREATE TABLE `citizen_disabilities` (
	`id` text PRIMARY KEY NOT NULL,
	`citizen_id` text NOT NULL,
	`disability_type` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`citizen_id`) REFERENCES `citizens`(`id`) ON UPDATE no action ON DELETE cascade
);
