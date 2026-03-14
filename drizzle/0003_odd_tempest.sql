-- ✅ SIRF NAYE TABLES KA CODE RAKHO

-- Daily Stats Table
CREATE TABLE IF NOT EXISTS "daily_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" varchar(10) NOT NULL,
	"total_visitors" integer DEFAULT 0,
	"new_visitors" integer DEFAULT 0,
	"returning_visitors" integer DEFAULT 0,
	"total_page_views" integer DEFAULT 0,
	"avg_time_on_site" integer DEFAULT 0,
	"top_pages" jsonb,
	"device_breakdown" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "daily_stats_date_unique" UNIQUE("date")
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "page_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"visitor_id" varchar(100) NOT NULL,
	"session_id" varchar(100) NOT NULL,
	"page_path" varchar(255) NOT NULL,
	"page_title" varchar(255),
	"device_type" varchar(50),
	"browser" varchar(50),
	"os" varchar(50),
	"country" varchar(100),
	"city" varchar(100),
	"referrer" varchar(500),
	"viewed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now()
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "visitor_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"visitor_id" varchar(100) NOT NULL,
	"session_id" varchar(100) NOT NULL,
	"entry_page" varchar(255),
	"exit_page" varchar(255),
	"page_views" integer DEFAULT 1,
	"started_at" timestamp DEFAULT now(),
	"last_active" timestamp DEFAULT now(),
	"ended_at" timestamp,
	"duration" integer DEFAULT 0,
	CONSTRAINT "visitor_sessions_session_id_unique" UNIQUE("session_id")
);