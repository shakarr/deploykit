CREATE TABLE IF NOT EXISTS "alert_rules" (
  "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "service_type"     varchar(20)  NOT NULL,
  "service_id"       uuid         NOT NULL,
  "service_name"     varchar(255),
  "metric"           varchar(20)  NOT NULL,
  "operator"         varchar(5)   NOT NULL,
  "threshold"        integer      NOT NULL,
  "channel"          varchar(20)  NOT NULL,
  "channel_config"   jsonb,
  "cooldown_minutes" integer      NOT NULL DEFAULT 15,
  "enabled"          boolean      NOT NULL DEFAULT true,
  "created_at"       timestamp    NOT NULL DEFAULT now(),
  "updated_at"       timestamp    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "alert_rules_service_idx"
  ON "alert_rules" ("service_type", "service_id");

CREATE TABLE IF NOT EXISTS "alert_events" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "rule_id"      uuid         NOT NULL REFERENCES "alert_rules"("id") ON DELETE CASCADE,
  "service_type" varchar(20)  NOT NULL,
  "service_id"   uuid         NOT NULL,
  "service_name" varchar(255),
  "metric"       varchar(20)  NOT NULL,
  "value"        real         NOT NULL,
  "message"      text         NOT NULL,
  "resolved_at"  timestamp,
  "created_at"   timestamp    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "alert_events_rule_idx"
  ON "alert_events" ("rule_id");
CREATE INDEX IF NOT EXISTS "alert_events_created_idx"
  ON "alert_events" ("created_at");
CREATE INDEX IF NOT EXISTS "alert_events_service_idx"
  ON "alert_events" ("service_type", "service_id");
