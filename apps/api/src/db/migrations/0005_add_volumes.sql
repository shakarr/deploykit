-- Add volumes column for persistent volume mounts
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "volumes" jsonb;