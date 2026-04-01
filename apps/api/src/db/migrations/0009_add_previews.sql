ALTER TABLE "applications"
  ADD COLUMN IF NOT EXISTS "preview_enabled"          boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "preview_domain"           varchar(255),
  ADD COLUMN IF NOT EXISTS "is_preview"               boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "parent_application_id"    uuid         REFERENCES "applications"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "preview_pr_number"        integer,
  ADD COLUMN IF NOT EXISTS "preview_branch"           varchar(100);

CREATE INDEX IF NOT EXISTS "applications_parent_idx"    ON "applications" ("parent_application_id");
CREATE INDEX IF NOT EXISTS "applications_is_preview_idx" ON "applications" ("is_preview");
