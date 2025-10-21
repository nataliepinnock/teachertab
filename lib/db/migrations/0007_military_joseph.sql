CREATE TABLE "timetable_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"timetable_slot_id" integer NOT NULL,
	"activity_type" varchar(20) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"location" varchar(100),
	"color" varchar(10),
	"day_of_week" varchar(10) NOT NULL,
	"week_number" integer DEFAULT 1 NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "timetable_activities" ADD CONSTRAINT "timetable_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_activities" ADD CONSTRAINT "timetable_activities_timetable_slot_id_timetable_slots_id_fk" FOREIGN KEY ("timetable_slot_id") REFERENCES "public"."timetable_slots"("id") ON DELETE no action ON UPDATE no action;