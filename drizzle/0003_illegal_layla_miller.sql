CREATE TABLE `involvement` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`interest` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `registrations` ADD `status` text DEFAULT 'registered' NOT NULL;