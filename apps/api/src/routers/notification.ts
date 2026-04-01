import { z } from "zod";
import { eq, and, isNull, desc } from "drizzle-orm";

import { notificationChannels, NOTIFICATION_EVENTS } from "../db/schema/index";
import { sendTestNotification } from "../services/notifier";
import { logAction } from "../lib/audit";
import {
  router,
  protectedProcedure,
  operatorProcedure,
  adminProcedure,
} from "../trpc";

const channelTypeEnum = z.enum([
  "discord",
  "slack",
  "telegram",
  "email",
  "webhook",
]);

const eventEnum = z.enum(
  NOTIFICATION_EVENTS as unknown as [string, ...string[]],
);

export const notificationRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (input.projectId) {
        return ctx.db.query.notificationChannels.findMany({
          where: eq(notificationChannels.projectId, input.projectId),
          orderBy: [desc(notificationChannels.createdAt)],
        });
      }
      // Global channels
      return ctx.db.query.notificationChannels.findMany({
        where: isNull(notificationChannels.projectId),
        orderBy: [desc(notificationChannels.createdAt)],
      });
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const channel = await ctx.db.query.notificationChannels.findFirst({
        where: eq(notificationChannels.id, input.id),
      });
      if (!channel) throw new Error("Notification channel not found");
      return channel;
    }),

  create: operatorProcedure
    .input(
      z.object({
        projectId: z.string().uuid().nullable().optional(),
        name: z.string().min(1).max(100),
        type: channelTypeEnum,
        config: z.record(z.string(), z.string()),
        events: z.array(eventEnum).min(1),
        enabled: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [channel] = await ctx.db
        .insert(notificationChannels)
        .values({
          projectId: input.projectId || null,
          name: input.name,
          type: input.type,
          config: input.config,
          events: input.events,
          enabled: input.enabled,
        })
        .returning();

      await logAction(ctx, {
        action: "notification.create",
        resourceType: "notification_channel",
        resourceId: channel!.id,
        resourceName: channel!.name,
        metadata: { type: input.type, events: input.events },
      });

      return channel!;
    }),

  update: operatorProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        config: z.record(z.string(), z.string()).optional(),
        events: z.array(eventEnum).min(1).optional(),
        enabled: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [channel] = await ctx.db
        .update(notificationChannels)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(notificationChannels.id, id))
        .returning();

      await logAction(ctx, {
        action: "notification.update",
        resourceType: "notification_channel",
        resourceId: channel!.id,
        resourceName: channel!.name,
      });

      return channel!;
    }),

  delete: operatorProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const channel = await ctx.db.query.notificationChannels.findFirst({
        where: eq(notificationChannels.id, input.id),
      });

      await ctx.db
        .delete(notificationChannels)
        .where(eq(notificationChannels.id, input.id));

      await logAction(ctx, {
        action: "notification.delete",
        resourceType: "notification_channel",
        resourceId: input.id,
        resourceName: channel?.name,
      });

      return { success: true };
    }),

  toggle: operatorProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const channel = await ctx.db.query.notificationChannels.findFirst({
        where: eq(notificationChannels.id, input.id),
      });
      if (!channel) throw new Error("Channel not found");

      const [updated] = await ctx.db
        .update(notificationChannels)
        .set({ enabled: !channel.enabled, updatedAt: new Date() })
        .where(eq(notificationChannels.id, input.id))
        .returning();

      return updated!;
    }),

  test: operatorProcedure
    .input(
      z.object({
        type: channelTypeEnum,
        config: z.record(z.string(), z.string()),
      }),
    )
    .mutation(async ({ input }) => {
      return sendTestNotification(input.type, input.config);
    }),

  availableEvents: protectedProcedure.query(() => {
    return NOTIFICATION_EVENTS.map((event) => ({
      value: event,
      label: event
        .replace(/\./g, " → ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    }));
  }),
});
