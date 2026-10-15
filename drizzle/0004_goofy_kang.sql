ALTER TABLE `articles` ADD `publication` text DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `capacity` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `publication` text DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `registration_open` text DEFAULT 'yes' NOT NULL;