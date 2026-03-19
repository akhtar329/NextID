CREATE TABLE "location_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip" varchar(50) NOT NULL,
	"country" varchar(100),
	"country_code" varchar(10),
	"city" varchar(100),
	"region" varchar(100),
	"latitude" varchar(50),
	"longitude" varchar(50),
	"timezone" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "location_cache_ip_unique" UNIQUE("ip")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false,
	"link" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"session_token" varchar(255) NOT NULL,
	"last_active" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "system_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"active_users" integer DEFAULT 0,
	"total_sessions" integer DEFAULT 0,
	"avg_response_time" integer DEFAULT 0,
	"error_rate" integer DEFAULT 0,
	"cpu_usage" integer DEFAULT 0,
	"memory_usage" integer DEFAULT 0,
	"disk_usage" integer DEFAULT 0,
	"uptime" integer DEFAULT 0,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "last_login" timestamp;--> statement-breakpoint
ALTER TABLE "daily_stats" ADD COLUMN "bounce_rate" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "daily_stats" ADD COLUMN "browser_breakdown" jsonb;--> statement-breakpoint
ALTER TABLE "daily_stats" ADD COLUMN "os_breakdown" jsonb;--> statement-breakpoint
ALTER TABLE "daily_stats" ADD COLUMN "country_breakdown" jsonb;--> statement-breakpoint
ALTER TABLE "daily_stats" ADD COLUMN "city_breakdown" jsonb;--> statement-breakpoint
ALTER TABLE "daily_stats" ADD COLUMN "avg_load_time" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "daily_stats" ADD COLUMN "avg_api_latency" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "page_views" ADD COLUMN "country_code" varchar(10);--> statement-breakpoint
ALTER TABLE "page_views" ADD COLUMN "region" varchar(100);--> statement-breakpoint
ALTER TABLE "page_views" ADD COLUMN "latitude" varchar(50);--> statement-breakpoint
ALTER TABLE "page_views" ADD COLUMN "longitude" varchar(50);--> statement-breakpoint
ALTER TABLE "page_views" ADD COLUMN "timezone" varchar(100);--> statement-breakpoint
ALTER TABLE "page_views" ADD COLUMN "load_time" integer;--> statement-breakpoint
ALTER TABLE "page_views" ADD COLUMN "api_latency" integer;--> statement-breakpoint
ALTER TABLE "page_views" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "visitor_sessions" ADD COLUMN "country" varchar(100);--> statement-breakpoint
ALTER TABLE "visitor_sessions" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "visitor_sessions" ADD COLUMN "latitude" varchar(50);--> statement-breakpoint
ALTER TABLE "visitor_sessions" ADD COLUMN "longitude" varchar(50);--> statement-breakpoint
ALTER TABLE "visitor_sessions" ADD COLUMN "device_type" varchar(50);--> statement-breakpoint
ALTER TABLE "visitor_sessions" ADD COLUMN "browser" varchar(50);--> statement-breakpoint
ALTER TABLE "visitor_sessions" ADD COLUMN "os" varchar(50);--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_admin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_admin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_admin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_user_id_admin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;