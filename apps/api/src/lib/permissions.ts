import { eq, and } from "drizzle-orm";
import { db } from "../db/index";
import { projectMembers, applications, databases } from "../db/schema/index";
import type { User } from "../db/schema/index";
import type { UserRole } from "@deploykit/shared";

const ROLE_LEVEL: Record<string, number> = {
  admin: 3,
  operator: 2,
  viewer: 1,
};

/**
 * Returns the effective role for a user within a specific project.
 *
 * Rules:
 *  1. Global admin → always admin (superadmin, cannot be downgraded per-project)
 *  2. If user has a project_members entry → use that role
 *  3. Otherwise → fall back to global role
 */
const getProjectRole = async (
  user: User,
  projectId: string,
): Promise<UserRole> => {
  // Global admins are always admin everywhere
  if (user.role === "admin") return "admin";

  // Check for per-project override
  const member = await db.query.projectMembers.findFirst({
    where: and(
      eq(projectMembers.projectId, projectId),
      eq(projectMembers.userId, user.id),
    ),
  });

  if (member) return member.role as UserRole;

  // Fall back to global role
  return user.role as UserRole;
};

/**
 * Resolve role from an application ID (looks up the app's projectId first).
 */
const getProjectRoleByAppId = async (
  user: User,
  applicationId: string,
): Promise<UserRole> => {
  if (user.role === "admin") return "admin";

  const app = await db.query.applications.findFirst({
    where: eq(applications.id, applicationId),
    columns: { projectId: true },
  });

  if (!app) return user.role as UserRole;
  return getProjectRole(user, app.projectId);
};

/**
 * Resolve role from a database ID (looks up the db's projectId first).
 */
const getProjectRoleByDbId = async (
  user: User,
  databaseId: string,
): Promise<UserRole> => {
  if (user.role === "admin") return "admin";

  const database = await db.query.databases.findFirst({
    where: eq(databases.id, databaseId),
    columns: { projectId: true },
  });

  if (!database) return user.role as UserRole;
  return getProjectRole(user, database.projectId);
};

// Permission checks
const canOperate = (role: UserRole): boolean => {
  return ROLE_LEVEL[role]! >= ROLE_LEVEL["operator"]!;
};

const isAdmin = (role: UserRole): boolean => {
  return role === "admin";
};

const canViewSecrets = (role: UserRole): boolean => {
  return role === "admin" || role === "operator";
};

export {
  getProjectRole,
  getProjectRoleByAppId,
  getProjectRoleByDbId,
  canOperate,
  isAdmin,
  canViewSecrets,
};
