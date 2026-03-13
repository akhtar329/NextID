CREATE TABLE "admission_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"admission_id" integer NOT NULL,
	"program_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "admissions" DROP CONSTRAINT "admissions_program_id_programs_id_fk";
--> statement-breakpoint
ALTER TABLE "news" DROP CONSTRAINT "news_program_d_programs_id_fk";
--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "program_id" integer;--> statement-breakpoint
ALTER TABLE "admission_programs" ADD CONSTRAINT "admission_programs_admission_id_admissions_id_fk" FOREIGN KEY ("admission_id") REFERENCES "public"."admissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_programs" ADD CONSTRAINT "admission_programs_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news" ADD CONSTRAINT "news_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admissions" DROP COLUMN "program_id";--> statement-breakpoint
ALTER TABLE "news" DROP COLUMN "program_d";