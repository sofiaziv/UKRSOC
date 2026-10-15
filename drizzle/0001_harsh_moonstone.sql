CREATE TABLE `articles` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`body` text NOT NULL,
	`image` text DEFAULT '' NOT NULL,
	`created` text NOT NULL
);
