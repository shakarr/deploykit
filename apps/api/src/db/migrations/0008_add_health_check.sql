ALTER TABLE "applications"
  ADD COLUMN IF NOT EXISTS "health_check_type"     varchar(10)  NOT NULL DEFAULT 'http',
  ADD COLUMN IF NOT EXISTS "health_check_path"     varchar(255)          DEFAULT '/',
  ADD COLUMN IF NOT EXISTS "health_check_timeout"  integer      NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS "health_check_interval" integer      NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS "health_check_retries"  integer      NOT NULL DEFAULT 6,
  ADD COLUMN IF NOT EXISTS "health_check_required" boolean      NOT NULL DEFAULT false;
