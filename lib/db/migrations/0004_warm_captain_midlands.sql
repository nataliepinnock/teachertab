CREATE TABLE "academic_years" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"week_cycle_start_date" date NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "holidays" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"academic_year_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"type" varchar(20) DEFAULT 'holiday' NOT NULL,
	"color" varchar(10)
);
--> statement-breakpoint
ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;