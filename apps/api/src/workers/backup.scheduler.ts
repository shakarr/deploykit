import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { databases } from "../db/schema/index";
import { backupQueue } from "../lib/redis";

/**
 * Simple cron scheduler for database backups.
 * Checks every minute for databases with backup enabled
 * and matches their cron expression against current time.
 */
const startBackupScheduler = (): NodeJS.Timeout => {
  // Check every 60 seconds
  const interval = setInterval(async () => {
    try {
      const allDbs = await db.query.databases.findMany({
        where: eq(databases.backupEnabled, true),
      });

      const now = new Date();

      for (const database of allDbs) {
        if (!database.backupCron || !database.containerId) continue;

        if (matchesCron(database.backupCron, now)) {
          console.log(`[backup-scheduler] Queuing backup for ${database.name}`);
          await backupQueue.add("backup", { databaseId: database.id });
        }
      }
    } catch (err: any) {
      console.error("[backup-scheduler] Error:", err.message);
    }
  }, 60_000);

  console.log("[backup-scheduler] Scheduler started (checking every 60s)");
  return interval;
};

const matchesCron = (expression: string, date: Date): boolean => {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return false;

  const [minExpr, hourExpr, dayExpr, monthExpr, weekdayExpr] = parts;

  return (
    matchField(minExpr!, date.getMinutes(), 60) &&
    matchField(hourExpr!, date.getHours(), 24) &&
    matchField(dayExpr!, date.getDate(), 31) &&
    matchField(monthExpr!, date.getMonth() + 1, 12) &&
    matchField(weekdayExpr!, date.getDay(), 7)
  );
};

const matchField = (expr: string, value: number, _max: number): boolean => {
  if (expr === "*") return true;

  // Handle step: */n or n/m
  if (expr.includes("/")) {
    const [base, stepStr] = expr.split("/");
    const step = parseInt(stepStr!, 10);
    if (isNaN(step) || step <= 0) return false;

    if (base === "*") {
      return value % step === 0;
    }
    const baseVal = parseInt(base!, 10);
    if (isNaN(baseVal)) return false;
    return value >= baseVal && (value - baseVal) % step === 0;
  }

  // Handle comma-separated: 1,5,10
  if (expr.includes(",")) {
    return expr.split(",").some((v) => parseInt(v, 10) === value);
  }

  // Handle range: 1-5
  if (expr.includes("-")) {
    const [start, end] = expr.split("-").map(Number);
    return value >= start! && value <= end!;
  }

  // Plain number
  return parseInt(expr, 10) === value;
};

export { startBackupScheduler };
