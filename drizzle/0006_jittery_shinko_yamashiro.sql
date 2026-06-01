CREATE TABLE "post_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"parent_id" integer,
	"user_name" varchar(100) NOT NULL,
	"user_email" varchar(255),
	"user_website" varchar(255),
	"comment" text NOT NULL,
	"is_approved" boolean DEFAULT false,
	"likes" integer DEFAULT 0,
	"user_agent" text,
	"ip_address" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(500) NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(500) NOT NULL,
	"content" text,
	"excerpt" text,
	"author_id" integer,
	"author_name" varchar(100),
	"featured_image" varchar(500),
	"gallery_images" jsonb,
	"meta_title" varchar(255),
	"meta_description" text,
	"focus_keyword" varchar(100),
	"status" varchar(20) DEFAULT 'published',
	"is_featured" boolean DEFAULT false,
	"is_popular" boolean DEFAULT false,
	"is_breaking" boolean DEFAULT false,
	"view_count" integer DEFAULT 0,
	"meta" jsonb,
	"tags" jsonb,
	"published_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "redirects" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_admin_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_comment_post" ON "post_comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_comment_approved" ON "post_comments" USING btree ("is_approved");--> statement-breakpoint
CREATE INDEX "idx_comment_created" ON "post_comments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_comment_parent" ON "post_comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_posts_slug" ON "posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_posts_type" ON "posts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_posts_status" ON "posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_posts_published_at" ON "posts" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "idx_posts_featured" ON "posts" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "idx_posts_popular" ON "posts" USING btree ("is_popular");--> statement-breakpoint
CREATE INDEX "idx_posts_author" ON "posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_posts_created_at" ON "posts" USING btree ("created_at");