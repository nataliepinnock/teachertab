ALTER TABLE "events" ADD COLUMN "is_recurring" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "recurrence_type" varchar(20);--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "recurrence_end_date" timestamp;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "parent_event_id" integer;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_parent_event_id_events_id_fk" FOREIGN KEY ("parent_event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;