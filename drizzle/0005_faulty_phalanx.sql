ALTER TABLE "admin_users" ADD COLUMN "password_reset_token" text;--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "password_reset_expires" timestamp;