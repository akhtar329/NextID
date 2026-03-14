CREATE TABLE "result_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"result_id" integer NOT NULL,
	"program_id" integer NOT NULL,
	"group_name" varchar(100),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "result_programs" ADD CONSTRAINT "result_programs_result_id_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "result_programs" ADD CONSTRAINT "result_programs_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;