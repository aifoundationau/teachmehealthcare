import { eq } from "drizzle-orm";
import { z } from "zod";

import { requireRole, requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { users } from "@/server/db/schema";
import { APP_TAG, env } from "@/server/env";
import { ApiError, json, route } from "@/server/http";
import { requiredText } from "@/server/validation";

export const dynamic = "force-dynamic";

const DEFAULT_SUPERADMINS = [
  {
    email: "firebase-adminsdk-fbsvc@ai-foundation-firebase.iam.gserviceaccount.com",
    fullName: "Firebase Service Account Admin",
    role: "superadmin",
    isSuperAdmin: true,
    notes: "Firebase Project Service Account Admin",
    createdAt: new Date().toISOString(),
  },
  {
    email: "superadmin@teachmehealthcare.org",
    fullName: "Chief SuperAdmin",
    role: "superadmin",
    isSuperAdmin: true,
    notes: "Executive SuperAdmin Account",
    createdAt: new Date().toISOString(),
  },
  {
    email: "admin@teachmehealthcare.org",
    fullName: "System SuperAdmin",
    role: "superadmin",
    isSuperAdmin: true,
    notes: "System Governance SuperAdmin",
    createdAt: new Date().toISOString(),
  },
];

/** Lists SuperAdmins. Accessible to SuperAdmins and Admins only. */
export const GET = route(async (req) => {
  const user = await requireUser(req);
  requireRole(user, ["admin"]);
  const db = await getDb();
  // Query users with superadmin role from database
  const dbSuperAdmins = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, "superadmin"));

  const merged = [...DEFAULT_SUPERADMINS];
  for (const d of dbSuperAdmins) {
    if (!merged.some((m) => m.email.toLowerCase() === d.email.toLowerCase())) {
      merged.push({
        email: d.email,
        fullName: d.fullName,
        role: "superadmin",
        isSuperAdmin: true,
        notes: "Designated SuperAdmin in Database",
        createdAt: d.createdAt.toISOString(),
      });
    }
  }

  return json({
    superadmins: merged,
    firebaseProjectId: env.firebaseProjectId,
  });
});

const addSuperAdminSchema = z.object({
  email: z.string().email().max(255),
  fullName: requiredText(2, 255),
  notes: z.string().max(1000).optional(),
});

/** Grants SuperAdmin to an email address. Only an existing SuperAdmin can do this. */
export const POST = route(async (req) => {
  const user = await requireUser(req);
  if (user.role !== "superadmin") {
    throw new ApiError(403, "Only a SuperAdmin can designate another SuperAdmin.");
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "Invalid JSON payload");
  }

  const { email, fullName, notes } = addSuperAdminSchema.parse(body);
  const cleanEmail = email.toLowerCase().trim();
  const db = await getDb();

  // Update existing user or create a superadmin user in the database
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, cleanEmail))
    .limit(1);

  let updatedUser;
  if (existing.length > 0) {
    [updatedUser] = await db
      .update(users)
      .set({ role: "superadmin" })
      .where(eq(users.email, cleanEmail))
      .returning();
  } else {
    [updatedUser] = await db
      .insert(users)
      .values({
        email: cleanEmail,
        firebaseUid: `superadmin-${Date.now()}`,
        fullName,
        role: "superadmin",
        appTag: APP_TAG,
        isVerified: true,
      })
      .returning();
  }

  return json(
    {
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        isSuperAdmin: true,
        notes: notes || "Designated SuperAdmin",
      },
      message: `SuperAdmin role granted to ${cleanEmail}.`,
    },
    201
  );
});
