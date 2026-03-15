CREATE TABLE `council_signatories` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL UNIQUE,
	`name` text NOT NULL DEFAULT '',
	`id_number` text NOT NULL DEFAULT '',
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch())
);

-- Seed the 4 required roles with empty values
INSERT INTO `council_signatories` (`id`, `role`, `name`, `id_number`) VALUES
  (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6))), 'vocero_electoral', '', ''),
  (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6))), 'vocero_contraloria', '', ''),
  (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6))), 'testigo_1', '', ''),
  (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6))), 'testigo_2', '', '');
