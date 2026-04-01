import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { applications } from "./applications";
import { databases } from "./databases";
import { notificationChannels } from "./notification-channels";
import { projectMembers } from "./project-members";

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectRelations = relations(projects, ({ many }) => ({
  applications: many(applications),
  databases: many(databases),
  notificationChannels: many(notificationChannels),
  members: many(projectMembers),
}));

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
