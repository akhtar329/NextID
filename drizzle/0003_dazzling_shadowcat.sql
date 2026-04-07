CREATE TABLE "admission_offerings" (
	"id" serial PRIMARY KEY NOT NULL,
	"admission_id" integer NOT NULL,
	"offering_id" integer NOT NULL,
	"seats" integer,
	"fee_amount" varchar(100),
	"specific_eligibility" text,
	"status" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_admission_offering" UNIQUE("admission_id","offering_id")
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"excerpt" text,
	"author_id" integer,
	"author_name" varchar(100),
	"focus_keyword" varchar(100),
	"program_id" integer,
	"category_id" integer,
	"featured_image" varchar(500),
	"category" varchar(50),
	"tags" jsonb,
	"view_count" integer DEFAULT 0,
	"reading_time" integer,
	"is_featured" boolean DEFAULT false,
	"status" varchar(20) DEFAULT 'draft',
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "career_paths" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
	"job_title" varchar(150) NOT NULL,
	"description" text,
	"starting_salary_min" integer,
	"starting_salary_max" integer,
	"mid_level_salary_min" integer,
	"mid_level_salary_max" integer,
	"top_companies" jsonb,
	"growth_potential" varchar(50),
	"market_demand" varchar(50),
	"display_order" integer DEFAULT 0,
	"status" boolean DEFAULT true,
	"slug" varchar(200),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "career_paths_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "program_comparisons" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_1_id" integer NOT NULL,
	"program_2_id" integer NOT NULL,
	"slug" varchar(255) NOT NULL,
	"comparison_overview" text,
	"key_differences" jsonb,
	"similarities" text,
	"which_to_choose" text,
	"view_count" integer DEFAULT 0,
	"status" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "program_comparisons_slug_unique" UNIQUE("slug"),
	CONSTRAINT "unique_program_comparison" UNIQUE("program_1_id","program_2_id")
);
--> statement-breakpoint
CREATE TABLE "program_curriculum" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
	"semester" integer NOT NULL,
	"course_name" varchar(255) NOT NULL,
	"course_code" varchar(50),
	"credit_hours" integer,
	"description" text,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "program_faqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"display_order" integer DEFAULT 0,
	"status" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "program_offerings" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
	"degree_id" integer NOT NULL,
	"institute_id" integer NOT NULL,
	"custom_name" varchar(255),
	"duration" varchar(50),
	"fee_range" varchar(100),
	"specific_eligibility" text,
	"additional_info" text,
	"specializations" jsonb,
	"status" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_program_degree_institute" UNIQUE("program_id","degree_id","institute_id")
);
--> statement-breakpoint
CREATE TABLE "program_prerequisites" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"requirement" text NOT NULL,
	"is_required" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "program_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"offering_id" integer NOT NULL,
	"reviewer_name" varchar(100),
	"reviewer_batch" varchar(50),
	"reviewer_photo" varchar(500),
	"rating" integer NOT NULL,
	"title" varchar(255),
	"review" text NOT NULL,
	"pros" jsonb,
	"cons" jsonb,
	"helpful_count" integer DEFAULT 0,
	"is_verified" boolean DEFAULT false,
	"is_approved" boolean DEFAULT false,
	"status" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "program_skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
	"skill_name" varchar(100) NOT NULL,
	"skill_category" varchar(50),
	"proficiency_level" varchar(50),
	"display_order" integer DEFAULT 0,
	"slug" varchar(200),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "redirects" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_path" varchar(500) NOT NULL,
	"to_path" varchar(500) NOT NULL,
	"status_code" integer DEFAULT 301 NOT NULL,
	"hit_count" integer DEFAULT 0,
	"last_hit" timestamp,
	"status" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "redirects_from_path_unique" UNIQUE("from_path")
);
--> statement-breakpoint
CREATE TABLE "result_offerings" (
	"id" serial PRIMARY KEY NOT NULL,
	"result_id" integer NOT NULL,
	"offering_id" integer NOT NULL,
	"group_name" varchar(100),
	"pass_percentage" numeric(5, 2),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scholarships" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"institute_id" integer,
	"organization_name" varchar(255),
	"description" text,
	"eligibility" text,
	"coverage" text,
	"amount" varchar(100),
	"program_ids" jsonb,
	"application_deadline" timestamp,
	"year" integer NOT NULL,
	"official_link" varchar(255),
	"application_link" varchar(255),
	"is_featured" boolean DEFAULT false,
	"view_count" integer DEFAULT 0,
	"status" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "scholarships_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sitemap_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" varchar(500) NOT NULL,
	"change_freq" varchar(20) DEFAULT 'weekly',
	"priority" numeric(2, 1) DEFAULT '0.5',
	"last_modified" timestamp DEFAULT now(),
	"status" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sitemap_entries_url_unique" UNIQUE("url")
);
--> statement-breakpoint
ALTER TABLE "admission_programs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "program_cities" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "program_institutes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "result_programs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "admission_programs" CASCADE;--> statement-breakpoint
DROP TABLE "program_cities" CASCADE;--> statement-breakpoint
DROP TABLE "program_institutes" CASCADE;--> statement-breakpoint
DROP TABLE "result_programs" CASCADE;--> statement-breakpoint
ALTER TABLE "seo_metadata" DROP CONSTRAINT "seo_metadata_entity_type_entity_id_unique";--> statement-breakpoint
ALTER TABLE "date_sheets" DROP CONSTRAINT "date_sheets_university_id_institutes_id_fk";
--> statement-breakpoint
ALTER TABLE "date_sheets" DROP CONSTRAINT "date_sheets_board_id_boards_id_fk";
--> statement-breakpoint
ALTER TABLE "degrees" DROP CONSTRAINT "degrees_category_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "programs" DROP CONSTRAINT "programs_degree_id_degrees_id_fk";
--> statement-breakpoint
ALTER TABLE "results" DROP CONSTRAINT "results_program_id_programs_id_fk";
--> statement-breakpoint
ALTER TABLE "results" DROP CONSTRAINT "results_university_id_institutes_id_fk";
--> statement-breakpoint
DROP INDEX "idx_seo_metadata_entity";--> statement-breakpoint
ALTER TABLE "admissions" ALTER COLUMN "gallery_images" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "date_sheets" ALTER COLUMN "official_link" SET DATA TYPE varchar(500);--> statement-breakpoint
ALTER TABLE "degrees" ALTER COLUMN "level_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "admissions" ADD COLUMN "open_date" timestamp;--> statement-breakpoint
ALTER TABLE "admissions" ADD COLUMN "close_date" timestamp;--> statement-breakpoint
ALTER TABLE "admissions" ADD COLUMN "eligibility" text;--> statement-breakpoint
ALTER TABLE "admissions" ADD COLUMN "how_to_apply" text;--> statement-breakpoint
ALTER TABLE "admissions" ADD COLUMN "required_documents" jsonb;--> statement-breakpoint
ALTER TABLE "admissions" ADD COLUMN "fee_structure" jsonb;--> statement-breakpoint
ALTER TABLE "admissions" ADD COLUMN "application_link" varchar(255);--> statement-breakpoint
ALTER TABLE "admissions" ADD COLUMN "view_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "boards" ADD COLUMN "logo" varchar(500);--> statement-breakpoint
ALTER TABLE "boards" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "icon" varchar(100);--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "education_overview" text;--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "total_institutes" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "is_capital" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "slug" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "year" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "exam_type" varchar(100);--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "institute_id" integer;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "overview" text;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "about_exam" text;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "exam_structure" text;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "preparation_tips" text;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "important_guidelines" text;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "general_instructions" text;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "exam_day_instructions" text;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "reporting_instructions" text;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "paper_pattern" text;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "marking_scheme" text;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "practical_exam_start" timestamp;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "practical_exam_end" timestamp;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "theory_exam_start" timestamp;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "theory_exam_end" timestamp;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "morning_time" varchar(50);--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "evening_time" varchar(50);--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "exam_duration" varchar(50);--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "subjects" jsonb;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "subject_groups" jsonb;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "total_subjects" integer;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "total_groups" integer;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "download_link" varchar(500);--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "pdf_file" varchar(500);--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "supplementary_pdf" varchar(500);--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "featured_image" varchar(500);--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "thumbnail_image" varchar(500);--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "gallery_images" jsonb;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "is_featured" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "is_urgent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "is_revised" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "revised_date" timestamp;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "view_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "download_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "share_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "tags" jsonb;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "source" varchar(255);--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "source_url" varchar(500);--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "related_date_sheets" jsonb;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "institutes" ADD COLUMN "ownership" varchar(50);--> statement-breakpoint
ALTER TABLE "institutes" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "institutes" ADD COLUMN "about" text;--> statement-breakpoint
ALTER TABLE "institutes" ADD COLUMN "facilities" jsonb;--> statement-breakpoint
ALTER TABLE "institutes" ADD COLUMN "email" varchar(255);--> statement-breakpoint
ALTER TABLE "institutes" ADD COLUMN "phone" varchar(50);--> statement-breakpoint
ALTER TABLE "institutes" ADD COLUMN "accreditations" jsonb;--> statement-breakpoint
ALTER TABLE "institutes" ADD COLUMN "established_year" integer;--> statement-breakpoint
ALTER TABLE "institutes" ADD COLUMN "gallery_images" jsonb;--> statement-breakpoint
ALTER TABLE "institutes" ADD COLUMN "total_programs" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "institutes" ADD COLUMN "total_admissions" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "institutes" ADD COLUMN "ranking" integer;--> statement-breakpoint
ALTER TABLE "institutes" ADD COLUMN "is_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "institutes" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "levels" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "category" varchar(50);--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "tags" jsonb;--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "source_url" varchar(500);--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "view_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "page_views" ADD COLUMN "referrer_domain" varchar(100);--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "category_id" integer;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "short_description" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "detailed_overview" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "what_you_learn" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "why_study_this" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "career_outlook" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "industry_demand" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "typical_duration" varchar(50);--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "typical_fee_range" varchar(100);--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "common_eligibility" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "featured_image" varchar(500);--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "icon" varchar(100);--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "total_offerings" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "total_admissions_open" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "average_salary_range" varchar(100);--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "is_popular" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "meta_title" varchar(255);--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "meta_description" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "focus_keyword" varchar(100);--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "related_program_ids" jsonb;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "intro_video_url" varchar(500);--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "graduates_count" integer;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "placement_rate" integer;--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "exam_type" varchar(100);--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "featured_image" varchar(500);--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "view_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "seo_metadata" ADD COLUMN "variation" varchar(50) DEFAULT 'default';--> statement-breakpoint
ALTER TABLE "seo_metadata" ADD COLUMN "meta_keywords" text;--> statement-breakpoint
ALTER TABLE "seo_metadata" ADD COLUMN "schema_markup" jsonb;--> statement-breakpoint
ALTER TABLE "seo_metadata" ADD COLUMN "og_type" varchar(50) DEFAULT 'website';--> statement-breakpoint
ALTER TABLE "seo_metadata" ADD COLUMN "twitter_card" varchar(50) DEFAULT 'summary_large_image';--> statement-breakpoint
ALTER TABLE "seo_metadata" ADD COLUMN "twitter_title" varchar(255);--> statement-breakpoint
ALTER TABLE "seo_metadata" ADD COLUMN "twitter_description" text;--> statement-breakpoint
ALTER TABLE "seo_metadata" ADD COLUMN "twitter_image" varchar(500);--> statement-breakpoint
ALTER TABLE "admission_offerings" ADD CONSTRAINT "admission_offerings_admission_id_admissions_id_fk" FOREIGN KEY ("admission_id") REFERENCES "public"."admissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_offerings" ADD CONSTRAINT "admission_offerings_offering_id_program_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."program_offerings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_admin_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_paths" ADD CONSTRAINT "career_paths_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_comparisons" ADD CONSTRAINT "program_comparisons_program_1_id_programs_id_fk" FOREIGN KEY ("program_1_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_comparisons" ADD CONSTRAINT "program_comparisons_program_2_id_programs_id_fk" FOREIGN KEY ("program_2_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_curriculum" ADD CONSTRAINT "program_curriculum_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_faqs" ADD CONSTRAINT "program_faqs_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_offerings" ADD CONSTRAINT "program_offerings_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_offerings" ADD CONSTRAINT "program_offerings_degree_id_degrees_id_fk" FOREIGN KEY ("degree_id") REFERENCES "public"."degrees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_offerings" ADD CONSTRAINT "program_offerings_institute_id_institutes_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institutes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_prerequisites" ADD CONSTRAINT "program_prerequisites_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_reviews" ADD CONSTRAINT "program_reviews_offering_id_program_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."program_offerings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_skills" ADD CONSTRAINT "program_skills_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "result_offerings" ADD CONSTRAINT "result_offerings_result_id_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "result_offerings" ADD CONSTRAINT "result_offerings_offering_id_program_offerings_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."program_offerings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scholarships" ADD CONSTRAINT "scholarships_institute_id_institutes_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institutes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_offering_program" ON "program_offerings" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "idx_offering_institute" ON "program_offerings" USING btree ("institute_id");--> statement-breakpoint
ALTER TABLE "date_sheets" ADD CONSTRAINT "date_sheets_institute_id_institutes_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institutes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "date_sheets" ADD CONSTRAINT "date_sheets_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_seo_entity" ON "seo_metadata" USING btree ("entity_type","entity_id");--> statement-breakpoint
ALTER TABLE "date_sheets" DROP COLUMN "university_id";--> statement-breakpoint
ALTER TABLE "degrees" DROP COLUMN "category_id";--> statement-breakpoint
ALTER TABLE "news" DROP COLUMN "views";--> statement-breakpoint
ALTER TABLE "programs" DROP COLUMN "degree_id";--> statement-breakpoint
ALTER TABLE "programs" DROP COLUMN "overview";--> statement-breakpoint
ALTER TABLE "programs" DROP COLUMN "eligibility";--> statement-breakpoint
ALTER TABLE "programs" DROP COLUMN "duration";--> statement-breakpoint
ALTER TABLE "programs" DROP COLUMN "career_scope";--> statement-breakpoint
ALTER TABLE "programs" DROP COLUMN "fee_range";--> statement-breakpoint
ALTER TABLE "results" DROP COLUMN "program_id";--> statement-breakpoint
ALTER TABLE "results" DROP COLUMN "university_id";--> statement-breakpoint
ALTER TABLE "date_sheets" ADD CONSTRAINT "date_sheets_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "seo_metadata" ADD CONSTRAINT "seo_metadata_entity_variation" UNIQUE("entity_type","entity_id","variation");