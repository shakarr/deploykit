-- Add role column with default 'viewer'
ALTER TABLE "users" ADD COLUMN "role" varchar(20) DEFAULT 'viewer' NOT NULL;
--> statement-breakpoint
-- Migrate existing admin users
UPDATE "users" SET "role" = 'admin' WHERE "is_admin" = true;
--> statement-breakpoint
-- Drop the old boolean column
ALTER TABLE "users" DROP COLUMN "is_admin";
