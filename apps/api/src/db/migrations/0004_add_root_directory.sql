-- Add root_directory for monorepo support (e.g. "apps/web")
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "root_directory" varchar(255);