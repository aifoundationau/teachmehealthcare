import { and, eq, notInArray } from "drizzle-orm";
import { z } from "zod";

import { requireRole, requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { users } from "@/server/db/schema";
import { ApiError, json, route } from "@/server/http";
import { ASSIGNABLE_ROLES, PRIVILEGED_ROLES, lowercaseEnum } from "@/server/validation";

export const dynamic = "force-dynamic";

/**
 * Returns roles and their assignments. Accessible to SuperAdmins and Admins only,
 * because the response lists every user's email address.
 */
export const GET = route(async (req) => {
  const user = await requireUser(req);
  requireRole(user, ["admin"]);
  const db = await getDb();

  // Query all users and group by role
  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
    })
    .from(users);

  const roleAssignments: Record<string, string[]> = {};
  for (const u of allUsers) {
    const r = (u.role || "supporter").toLowerCase();
    if (!roleAssignments[r]) roleAssignments[r] = [];
    roleAssignments[r].push(u.email);
  }

  return json({
    roleAssignments,
    totalUsers: allUsers.length,
    requestingUser: {
      email: user.email,
      role: user.role,
      isSuperAdmin: user.role === "superadmin" || user.role === "admin",
    },
  });
});

const updateRoleBody = z.object({
  roleId: lowercaseEnum(ASSIGNABLE_ROLES),
  permissions: z.array(z.string()),
  assignedEmails: z.array(z.string().email()).max(500).optional(),
});

/**
 * Updates role assignments. Admins can assign non-administrative roles to users who are
 * not administrators themselves; only a SuperAdmin can grant or revoke administrator roles.
 */
export const POST = route(async (req) => {
  const user = await requireUser(req);
  requireRole(user, ["admin"]);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "Invalid JSON payload");
  }

  const { roleId, permissions, assignedEmails } = updateRoleBody.parse(body);
  const isSuperAdmin = user.role === "superadmin";
  if (!isSuperAdmin && PRIVILEGED_ROLES.includes(roleId)) {
    throw new ApiError(403, "Only a SuperAdmin can assign administrator roles.");
  }
  const db = await getDb();

  // If assignedEmails are provided, update matching users in the database
  let assignedCount = 0;
  if (Array.isArray(assignedEmails)) {
    for (const email of assignedEmails) {
      const cleanEmail = email.toLowerCase().trim();
      const matchesEmail = eq(users.email, cleanEmail);
      const updated = await db
        .update(users)
        .set({ role: roleId })
        .where(isSuperAdmin ? matchesEmail : and(matchesEmail, notInArray(users.role, [...PRIVILEGED_ROLES])))
        .returning({ id: users.id });
      assignedCount += updated.length;
    }
  }

  return json({
    success: true,
    roleId,
    permissionsCount: permissions.length,
    assignedCount,
    message: `Permissions and assignments for ${roleId} updated successfully.`,
  });
});
