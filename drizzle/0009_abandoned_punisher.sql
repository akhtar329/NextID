ALTER TABLE "redirects" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "seo_metadata" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sitemap_entries" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "redirects" CASCADE;--> statement-breakpoint
DROP TABLE "seo_metadata" CASCADE;--> statement-breakpoint
DROP TABLE "sitemap_entries" CASCADE;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "meta_keywords" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "canonical_url" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "robots" varchar(100) DEFAULT 'index, follow';--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "og_title" varchar(255);--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "og_description" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "og_image" varchar(500);--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "og_type" varchar(50) DEFAULT 'article';--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "twitter_card" varchar(50) DEFAULT 'summary_large_image';--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "twitter_title" varchar(255);--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "twitter_description" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "twitter_image" varchar(500);--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "schema_markup" jsonb;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "focus_keyword_density" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "readability_score" integer;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "seo_score" integer;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "last_seo_analysis" timestamp;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "priority" numeric(2, 1) DEFAULT '0.5';--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "changefreq" varchar(20) DEFAULT 'weekly';--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "breadcrumb_title" varchar(255);--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "old_slug" varchar(500);--> statement-breakpoint
CREATE INDEX "idx_posts_meta_title" ON "posts" USING btree ("meta_title");--> statement-breakpoint
CREATE INDEX "idx_posts_focus_keyword" ON "posts" USING btree ("focus_keyword");--> statement-breakpoint
CREATE INDEX "idx_posts_seo_score" ON "posts" USING btree ("seo_score");--> statement-breakpoint
CREATE INDEX "idx_posts_old_slug" ON "posts" USING btree ("old_slug");