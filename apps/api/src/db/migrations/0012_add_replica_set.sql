ALTER TABLE "databases" ADD COLUMN IF NOT EXISTS "replica_set" boolean NOT NULL DEFAULT false;
