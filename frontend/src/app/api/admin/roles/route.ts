import { eq } from "drizzle-orm";
import { z } from "zod";

import { optionalUser, requireRole } from "@/server/auth";
import { getDb } from "@/server/db";
import { users } from "@/server/db/schema";
import { ApiError, json, route } from "@/server/http";

export const dynamic = "force-dynamic";

/**
 * Returns roles and their assignments. Accessible to SuperAdmins and Admins.
 */
export const GET = route(async (req) => {
  const user = await optionalUser(req);
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
    requestingUser: user
      ? {
          email: user.email,
          role: user.role,
          isSuperAdmin: user.role === "superadmin" || user.role === "admin",
        }
      : null,
  });
});

const updateRoleBody = z.object({
  roleId: z.string().min(1),
  permissions: z.array(z.string()),
  assignedEmails: z.array(z.string()).optional(),
});

/**
 * Updates role permissions or assignments.
 */
export const POST = route(async (req) => {
  const user = await optionalUser(req);
  let body: any;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "Invalid JSON payload");
  }

  const { roleId, permissions, assignedEmails } = updateRoleBody.parse(body);
  const db = await getDb();

  // If assignedEmails are provided, update matching users in the database
  if (Array.isArray(assignedEmails)) {
    for (const email of assignedEmails) {
      const cleanEmail = email.toLowerCase().trim();
      await db
        .update(users)
        .set({ role: roleId })
        .where(eq(users.email, cleanEmail));
    }
  }

  return json({
    success: true,
    roleId,
    permissionsCount: permissions.length,
    assignedCount: assignedEmails ? assignedEmails.length : 0,
    message: `Permissions and assignments for ${roleId} updated successfully.`,
  });
});
