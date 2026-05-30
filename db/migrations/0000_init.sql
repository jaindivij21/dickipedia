CREATE TABLE `actors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `actors_name` ON `actors` (`name`);--> statement-breakpoint
CREATE TABLE `blocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`target_actor_id` integer NOT NULL,
	`by_actor_id` integer NOT NULL,
	`reason_id` integer,
	`timestamp` integer,
	`expiry` integer,
	`is_sitewide` integer DEFAULT true,
	`scope_subject_id` integer
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hash` text,
	`text` text,
	`data` text
);
--> statement-breakpoint
CREATE TABLE `fact_qualifiers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fact_id` integer NOT NULL,
	`qualifier_property_key` text NOT NULL,
	`value` text,
	`value_type` text,
	`ordinal` integer DEFAULT 0
);
--> statement-breakpoint
CREATE INDEX `fact_qualifiers_fact` ON `fact_qualifiers` (`fact_id`);--> statement-breakpoint
CREATE TABLE `fact_sources` (
	`fact_id` integer NOT NULL,
	`source_id` integer NOT NULL,
	`ordinal` integer DEFAULT 0,
	PRIMARY KEY(`fact_id`, `source_id`)
);
--> statement-breakpoint
CREATE TABLE `facts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subject_id` integer NOT NULL,
	`property_key` text NOT NULL,
	`value` text,
	`value_type` text,
	`snaktype` text DEFAULT 'value' NOT NULL,
	`rank` text DEFAULT 'normal' NOT NULL,
	`fact_hash` text,
	`origin_revision_id` integer,
	`current` integer DEFAULT true,
	`period` text
);
--> statement-breakpoint
CREATE INDEX `facts_subject_property` ON `facts` (`subject_id`,`property_key`);--> statement-breakpoint
CREATE INDEX `facts_property` ON `facts` (`property_key`);--> statement-breakpoint
CREATE TABLE `logging` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`action` text NOT NULL,
	`timestamp` integer NOT NULL,
	`actor_id` integer NOT NULL,
	`subject_id` integer,
	`comment_id` integer,
	`params` text,
	`deleted` integer DEFAULT 0
);
--> statement-breakpoint
CREATE INDEX `logging_ts` ON `logging` (`timestamp`);--> statement-breakpoint
CREATE TABLE `page_dependencies` (
	`subject_id` integer NOT NULL,
	`dependent_path` text NOT NULL,
	`dependency_type` text,
	PRIMARY KEY(`subject_id`, `dependent_path`)
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`key` text PRIMARY KEY NOT NULL,
	`datatype` text NOT NULL,
	`label` text NOT NULL,
	`description` text,
	`is_relation` integer DEFAULT false
);
--> statement-breakpoint
CREATE TABLE `recent_changes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` integer NOT NULL,
	`actor_id` integer NOT NULL,
	`subject_id` integer,
	`subject_type` text,
	`change_type` text,
	`source_id` integer,
	`old_value` text,
	`new_value` text,
	`patrolled` integer DEFAULT 0,
	`review_priority` integer DEFAULT 0,
	`is_bot` integer DEFAULT false,
	`this_revision_id` integer,
	`last_revision_id` integer,
	`deleted` integer DEFAULT 0
);
--> statement-breakpoint
CREATE INDEX `rc_ts` ON `recent_changes` (`timestamp`);--> statement-breakpoint
CREATE INDEX `rc_patrolled` ON `recent_changes` (`patrolled`,`review_priority`);--> statement-breakpoint
CREATE TABLE `relationship_sources` (
	`relationship_id` integer NOT NULL,
	`source_id` integer NOT NULL,
	`ordinal` integer DEFAULT 0,
	PRIMARY KEY(`relationship_id`, `source_id`)
);
--> statement-breakpoint
CREATE TABLE `relationships` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`from_subject_id` integer NOT NULL,
	`relation_key` text NOT NULL,
	`to_subject_id` integer NOT NULL,
	`rank` text DEFAULT 'normal' NOT NULL,
	`origin_revision_id` integer,
	`current` integer DEFAULT true,
	`period` text
);
--> statement-breakpoint
CREATE INDEX `relationships_from` ON `relationships` (`from_subject_id`,`relation_key`);--> statement-breakpoint
CREATE INDEX `relationships_to` ON `relationships` (`to_subject_id`,`relation_key`);--> statement-breakpoint
CREATE TABLE `revisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subject_id` integer NOT NULL,
	`parent_id` integer,
	`actor_id` integer NOT NULL,
	`comment_id` integer,
	`timestamp` integer NOT NULL,
	`content_sha1` text,
	`content` text,
	`is_minor` integer DEFAULT false,
	`size_delta` integer,
	`deleted` integer DEFAULT 0,
	`revert_of_revision_id` integer
);
--> statement-breakpoint
CREATE INDEX `revisions_subject` ON `revisions` (`subject_id`,`id`);--> statement-breakpoint
CREATE INDEX `revisions_parent` ON `revisions` (`parent_id`);--> statement-breakpoint
CREATE TABLE `scores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subject_id` integer NOT NULL,
	`score_type` text NOT NULL,
	`value` integer,
	`breakdown` text,
	`computed_at` integer,
	`computed_from_revision_id` integer
);
--> statement-breakpoint
CREATE INDEX `scores_subject` ON `scores` (`subject_id`,`score_type`);--> statement-breakpoint
CREATE TABLE `sources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`publisher` text,
	`url` text,
	`title` text,
	`author` text,
	`published_date` text,
	`retrieved_date` text,
	`archive_url` text,
	`source_type` text
);
--> statement-breakpoint
CREATE INDEX `sources_url` ON `sources` (`url`);--> statement-breakpoint
CREATE TABLE `subject_restrictions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subject_id` integer NOT NULL,
	`type` text NOT NULL,
	`level` text NOT NULL,
	`expiry` integer
);
--> statement-breakpoint
CREATE INDEX `subject_restrictions_subject` ON `subject_restrictions` (`subject_id`);--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subject_type` text NOT NULL,
	`slug` text NOT NULL,
	`accountability_basis` text NOT NULL,
	`label` text NOT NULL,
	`description` text,
	`aliases` text DEFAULT '[]',
	`latest_revision_id` integer,
	`is_redirect` integer DEFAULT false,
	`redirect_to_id` integer,
	`protection_level` text,
	`touched_at` integer,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subjects_type_slug` ON `subjects` (`subject_type`,`slug`);--> statement-breakpoint
CREATE INDEX `subjects_type` ON `subjects` (`subject_type`);--> statement-breakpoint
CREATE TABLE `talk_threads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subject_id` integer NOT NULL,
	`fact_id` integer,
	`actor_id` integer NOT NULL,
	`parent_thread_id` integer,
	`body` text,
	`timestamp` integer
);
--> statement-breakpoint
CREATE INDEX `talk_subject` ON `talk_threads` (`subject_id`);--> statement-breakpoint
CREATE TABLE `user_groups` (
	`user_id` integer NOT NULL,
	`group` text NOT NULL,
	`expiry` integer,
	PRIMARY KEY(`user_id`, `group`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`password_hash` text,
	`oauth` text,
	`created_at` integer,
	`edit_count` integer DEFAULT 0
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_name` ON `users` (`name`);--> statement-breakpoint
CREATE TABLE `watchlist` (
	`user_id` integer NOT NULL,
	`subject_id` integer NOT NULL,
	`notification_timestamp` integer,
	PRIMARY KEY(`user_id`, `subject_id`)
);
