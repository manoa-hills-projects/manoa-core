PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_citizens` (
	`id` text PRIMARY KEY NOT NULL,
	`dni` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`birth_date` text NOT NULL,
	`gender` text NOT NULL,
	`is_head_of_household` integer DEFAULT false,
	`family_id` text,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_citizens`("id", "dni", "first_name", "last_name", "birth_date", "gender", "is_head_of_household", "family_id") SELECT "id", "dni", "first_name", "last_name", "birth_date", "gender", "is_head_of_household", "family_id" FROM `citizens`;--> statement-breakpoint
DROP TABLE `citizens`;--> statement-breakpoint
ALTER TABLE `__new_citizens` RENAME TO `citizens`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `citizens_dni_unique` ON `citizens` (`dni`);--> statement-breakpoint
CREATE TABLE `__new_families` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`house_id` text,
	`head_id` text,
	FOREIGN KEY (`house_id`) REFERENCES `houses`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_families`("id", "name", "house_id", "head_id") SELECT "id", "name", "house_id", "head_id" FROM `families`;--> statement-breakpoint
DROP TABLE `families`;--> statement-breakpoint
ALTER TABLE `__new_families` RENAME TO `families`;--> statement-breakpoint
CREATE UNIQUE INDEX `families_name_unique` ON `families` (`name`);