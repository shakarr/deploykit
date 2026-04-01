CREATE TABLE IF NOT EXISTS "notification_channels" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid REFERENCES "projects"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "type" varchar(20) NOT NULL,
  "config" jsonb NOT NULL DEFAULT '{}',
  "events" jsonb NOT NULL DEFAULT '["deploy.success","deploy.failed"]',
  "enabled" boolean NOT NULL DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "notif_channels_project_idx" ON "notification_channels" ("project_id");
