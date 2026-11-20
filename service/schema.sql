CREATE TABLE `pilot_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`fingerprint` text NOT NULL,
	`trial_order` text NOT NULL,
	`manual_ms` integer NOT NULL,
	`ai_ms` integer NOT NULL,
	`manual_wrong` integer NOT NULL,
	`ai_wrong` integer NOT NULL,
	`corrected` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `runs_created` ON `pilot_runs` (`created_at`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`revision` integer NOT NULL,
	`box` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rooms_created` ON `rooms` (`created_at`);