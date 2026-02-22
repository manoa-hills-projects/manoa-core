ALTER TABLE `homes` RENAME TO `houses`;--> statement-breakpoint
ALTER TABLE `houses` RENAME COLUMN "house_number" TO "number";--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_families` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`house_id` text,
	`head_id` text,
	FOREIGN KEY (`house_id`) REFERENCES `houses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_families`("id", "name", "house_id", "head_id") SELECT "id", "name", "house_id", "head_id" FROM `families`;--> statement-breakpoint
DROP TABLE `families`;--> statement-breakpoint
ALTER TABLE `__new_families` RENAME TO `families`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `families_name_unique` ON `families` (`name`);