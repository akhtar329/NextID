CREATE TABLE "seo_metadata" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" integer NOT NULL,
	"meta_title" varchar(255),
	"meta_description" text,
	"canonical_url" text,
	"robots" varchar(100) DEFAULT 'index, follow',
	"og_title" varchar(255),
	"og_description" text,
	"og_image" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "seo_metadata_entity_type_entity_id_unique" UNIQUE("entity_type","entity_id")
);
--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "image_url" varchar(500);--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "thumbnail_url" varchar(500);--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "latitude" numeric(10, 8);--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "longitude" numeric(11, 8);--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "population" integer;--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "area" varchar(50);--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "display_order" integer DEFAULT 0;--> statement-breakpoint
CREATE INDEX "idx_seo_metadata_entity" ON "seo_metadata" USING btree ("entity_type","entity_id");--> statement-breakpoint
ALTER TABLE "programs" DROP COLUMN "seo_title";--> statement-breakpoint
ALTER TABLE "programs" DROP COLUMN "seo_description";