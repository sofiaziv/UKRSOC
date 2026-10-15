ALTER TABLE `events` ADD `image` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `registrations` ADD `first_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `registrations` ADD `last_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `registrations` ADD `student_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `registrations` ADD `checked_in` text DEFAULT 'no' NOT NULL;