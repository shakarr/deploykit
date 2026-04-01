-- Add source_token column for private repo authentication (encrypted PAT)
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "source_token" text;