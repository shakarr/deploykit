import { lt } from "drizzle-orm";

import { db } from "../db/index";
import { auditLogs } from "../db/schema/index";

/**
 * Deletes audit log entries older than the configured retention period.
 * Runs once per day at ~04:00 local time (1 hour after image cleanup).
 * Default retention: 90 days. Override via AUDIT_RETENTION_DAYS env var.
 */
export const startAuditCleanupScheduler = (): NodeJS.Timeout => {
  const INTERVAL_MS = 60 * 60 * 1000; // check every hour
  const retentionDays = parseInt(process.env.AUDIT_RETENTION_DAYS || "90", 10);

  const interval = setInterval(async () => {
    const now = new Date();
    if (now.getHours() !== 4) return; // only run at 4am

    const cutoff = new Date(
      now.getTime() - retentionDays * 24 * 60 * 60 * 1000,
    );

    console.log(
      `[audit-cleanup] Deleting audit logs older than ${retentionDays} days (before ${cutoff.toISOString()})…`,
    );

    try {
      const result = await db
        .delete(auditLogs)
        .where(lt(auditLogs.createdAt, cutoff));

      const count = (result as any).rowCount ?? 0;
      console.log(`[audit-cleanup] Deleted ${count} old audit log entries`);
    } catch (err: any) {
      console.error("[audit-cleanup] Scheduler error:", err.message);
    }
  }, INTERVAL_MS);

  console.log(
    `[audit-cleanup] Scheduler started (runs daily at 04:00, retention: ${retentionDays} days)`,
  );
  return interval;
};
