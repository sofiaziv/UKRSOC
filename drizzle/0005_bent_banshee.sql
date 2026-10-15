ALTER TABLE `events` ADD `cost` text DEFAULT 'unspecified' NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `membership` text DEFAULT 'unspecified' NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `ticket_url` text DEFAULT '' NOT NULL;