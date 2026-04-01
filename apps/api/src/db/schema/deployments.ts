import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { applications } from "./applications";

export const deployments = pgTable("deployments", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id")
    .references(() => applications.id, { onDelete: "cascade" })
    .notNull(),
  // Git info
  commitHash: varchar("commit_hash", { length: 40 }),
  commitMessage: text("commit_message"),
  // Status
  status: varchar("status", { length: 20 }).default("queued").notNull(),
  buildLogs: text("build_logs"),
  deployLogs: text("deploy_logs"),
  errorMessage: text("error_message"),
  // Image
  imageName: varchar("image_name", { length: 500 }),
  // Timing
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deploymentRelations = relations(deployments, ({ one }) => ({
  application: one(applications, {
    fields: [deployments.applicationId],
    references: [applications.id],
  }),
}));

export type Deployment = typeof deployments.$inferSelect;
export type NewDeployment = typeof deployments.$inferInsert;
