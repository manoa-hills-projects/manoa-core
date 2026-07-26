CREATE TABLE IF NOT EXISTS `events` (
  `id` text PRIMARY KEY NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()),
  `title` text NOT NULL,
  `description` text,
  `date` text NOT NULL,
  `time` text,
  `duration` integer,
  `location` text DEFAULT 'online',
  `jitsi_room_name` text,
  `status` text NOT NULL DEFAULT 'scheduled',
  `created_by` text
);

CREATE INDEX IF NOT EXISTS `events_status_idx` ON `events`(`status`);
CREATE INDEX IF NOT EXISTS `events_date_idx` ON `events`(`date`);
