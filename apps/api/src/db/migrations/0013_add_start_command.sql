-- Add start_command column for overriding auto-detected start command (Nixpacks)
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "start_command" text;
