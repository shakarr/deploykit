import { pruneAllServers } from "../services/image-cleaner";

/**
 * Runs image cleanup once per day at ~03:00 local time.
 * Keeps the last 3 successful deployment images per app (for rollback),
 * removes everything else in the deploykit/* namespace.
 */
export function startImageCleanupScheduler(): NodeJS.Timeout {
  const INTERVAL_MS = 60 * 60 * 1000; // check every hour

  const interval = setInterval(async () => {
    const now = new Date();
    if (now.getHours() !== 3) return; // only run at 3am

    console.log("[image-cleanup] Starting nightly image cleanup…");
    try {
      const results = await pruneAllServers({ keep: 3, dryRun: false });

      let totalRemoved = 0;
      let totalFreed   = 0;
      for (const r of results) {
        totalRemoved += r.imagesRemoved;
        totalFreed   += r.bytesFreed;
        if (r.errors.length > 0) {
          console.warn(`[image-cleanup] Errors on ${r.serverName}:`, r.errors);
        }
      }

      const mb = (totalFreed / 1024 / 1024).toFixed(1);
      console.log(
        `[image-cleanup] Done — removed ${totalRemoved} image(s), freed ~${mb} MB`,
      );
    } catch (err: any) {
      console.error("[image-cleanup] Scheduler error:", err.message);
    }
  }, INTERVAL_MS);

  console.log("[image-cleanup] Scheduler started (runs daily at 03:00)");
  return interval;
}
