import { z } from "zod";
import { eq } from "drizzle-orm";

import { projects, applications, databases } from "../db/schema/index";

import { DockerService } from "../services/docker";
import {
  router,
  protectedProcedure,
  operatorProcedure,
  adminProcedure,
} from "../trpc";

import { createProjectSchema } from "@deploykit/shared";
import { logAction } from "../lib/audit";

const dockerService = new DockerService();

export const projectRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.projects.findMany({
      with: {
        applications: true,
        databases: true,
      },
      orderBy: (projects, { desc }) => [desc(projects.createdAt)],
    });
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.query.projects.findFirst({
        where: eq(projects.id, input.id),
        with: {
          applications: {
            with: { domains: true },
          },
          databases: true,
        },
      });
      if (!project) throw new Error("Project not found");
      return project;
    }),

  create: operatorProcedure
    .input(createProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const [project] = await ctx.db.insert(projects).values(input).returning();
      await logAction(ctx, {
        action: "project.create",
        resourceType: "project",
        resourceId: project!.id,
        resourceName: project!.name,
      });
      return project!;
    }),

  update: operatorProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [project] = await ctx.db
        .update(projects)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(projects.id, id))
        .returning();
      await logAction(ctx, {
        action: "project.update",
        resourceType: "project",
        resourceId: project!.id,
        resourceName: project!.name,
        metadata: data,
      });
      return project!;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.query.projects.findFirst({
        where: eq(projects.id, input.id),
      });

      // Stop all application containers
      const apps = await ctx.db.query.applications.findMany({
        where: eq(applications.projectId, input.id),
      });
      for (const app of apps) {
        if (app.containerId) {
          try {
            await dockerService.stopAndRemove(app.containerId);
          } catch {}
        }
      }

      // Stop all database containers
      const dbs = await ctx.db.query.databases.findMany({
        where: eq(databases.projectId, input.id),
      });
      for (const db of dbs) {
        if (db.containerId) {
          try {
            await dockerService.stopAndRemove(db.containerId);
          } catch {}
        }
      }

      // Cascade delete project + apps + dbs + deployments + domains
      await ctx.db.delete(projects).where(eq(projects.id, input.id));
      await logAction(ctx, {
        action: "project.delete",
        resourceType: "project",
        resourceId: input.id,
        resourceName: project?.name,
        metadata: { appsDeleted: apps.length, dbsDeleted: dbs.length },
      });
      return { success: true };
    }),
});
