ALTER TABLE "admissions" ADD COLUMN "featured_image" varchar(500);--> statement-breakpoint
ALTER TABLE "admissions" ADD COLUMN "gallery_images" text;--> statement-breakpoint
ALTER TABLE "boards" ADD COLUMN "established_year" integer;--> statement-breakpoint
ALTER TABLE "boards" ADD COLUMN "contact_email" varchar(255);--> statement-breakpoint
ALTER TABLE "boards" ADD COLUMN "contact_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "boards" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "institutes" ADD COLUMN "featured_image" varchar(500);--> statement-breakpoint
ALTER TABLE "institutes" ADD COLUMN "logo" varchar(500);