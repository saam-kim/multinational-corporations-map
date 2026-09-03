CREATE TABLE `participants` (
	`id` text PRIMARY KEY NOT NULL,
	`session_code` text NOT NULL,
	`name` text NOT NULL,
	`company_id` text,
	`hub_id` text,
	`role_guess` text,
	`role_correct` integer DEFAULT 0 NOT NULL,
	`inference` text,
	`evidence_open` integer DEFAULT 0 NOT NULL,
	`quiz_score` integer DEFAULT 0 NOT NULL,
	`feedback` text,
	`joined_at` integer NOT NULL,
	`last_seen` integer NOT NULL,
	FOREIGN KEY (`session_code`) REFERENCES `sessions`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_participants_session_code` ON `participants` (`session_code`);--> statement-breakpoint
CREATE INDEX `idx_participants_session_last_seen` ON `participants` (`session_code`,`last_seen`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`code` text PRIMARY KEY NOT NULL,
	`teacher_key` text NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'waiting' NOT NULL,
	`focus_company` text,
	`focus_hub` text,
	`message` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
PRAGMA optimize;
