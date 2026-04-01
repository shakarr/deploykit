import { desc, gte, isNull } from "drizzle-orm";

import {
  projects,
  deployments,
  servers,
  auditLogs,
  alertEvents,
} from "../db/schema/index";
import { router, protectedProcedure } from "../trpc";

export const dashboardRouter = router({
  /**
   * Single query that returns everything the dashboard needs.
   * Available to all authenticated users (viewer, operator, admin).
   */
  summary: protectedProcedure.query(async ({ ctx }) => {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      allProjects,
      allServers,
      recentDeploys,
      recentActivity,
      openAlerts,
      deploys24h,
      deploys7d,
    ] = await Promise.all([
      // Projects with apps + dbs
      ctx.db.query.projects.findMany({
        with: {
          applications: {
            columns: {
              id: true,
              name: true,
              status: true,
              containerId: true,
              branch: true,
              updatedAt: true,
            },
          },
          databases: {
            columns: {
              id: true,
              name: true,
              status: true,
              type: true,
            },
          },
        },
        orderBy: [desc(projects.updatedAt)],
      }),

      // Servers
      ctx.db.query.servers.findMany({
        columns: {
          id: true,
          name: true,
          host: true,
          status: true,
          isLocal: true,
          totalCpu: true,
          totalMemory: true,
          totalDisk: true,
          dockerVersion: true,
          lastHealthCheck: true,
        },
        orderBy: [desc(servers.createdAt)],
      }),

      // Recent deployments across all apps (last 12)
      ctx.db.query.deployments.findMany({
        with: {
          application: {
            columns: { id: true, name: true, projectId: true },
          },
        },
        orderBy: [desc(deployments.createdAt)],
        limit: 12,
      }),

      // Recent activity (last 20 audit log entries — visible to all roles)
      ctx.db.query.auditLogs.findMany({
        orderBy: [desc(auditLogs.createdAt)],
        limit: 20,
        columns: {
          id: true,
          userEmail: true,
          action: true,
          resourceType: true,
          resourceName: true,
          createdAt: true,
        },
      }),

      // Open alerts count
      ctx.db.$count(alertEvents, isNull(alertEvents.resolvedAt)),

      // Deploy counts
      ctx.db.$count(deployments, gte(deployments.createdAt, since24h)),
      ctx.db.$count(deployments, gte(deployments.createdAt, since7d)),
    ]);

    // Aggregate stats
    const allApps = allProjects.flatMap((p) => p.applications);
    const allDbs = allProjects.flatMap((p) => p.databases);

    const stats = {
      projects: allProjects.length,
      applications: allApps.length,
      appsRunning: allApps.filter((a) => a.status === "running").length,
      appsError: allApps.filter(
        (a) => a.status === "error" || a.status === "stopped",
      ).length,
      appsBuilding: allApps.filter(
        (a) => a.status === "building" || a.status === "deploying",
      ).length,
      databases: allDbs.length,
      dbsRunning: allDbs.filter((d) => d.status === "running").length,
      servers: allServers.length,
      serversConnected: allServers.filter((s) => s.status === "connected")
        .length,
      openAlerts: Number(openAlerts),
      deploys24h: Number(deploys24h),
      deploys7d: Number(deploys7d),
    };

    return {
      stats,
      projects: allProjects,
      servers: allServers,
      recentDeploys,
      recentActivity,
    };
  }),
});
