import { eq } from "drizzle-orm";

import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { users } from "@/server/db/schema";
import { APP_TAG } from "@/server/env";
import { json, parseJson, route } from "@/server/http";
import { profileSchema, profileUpdates } from "@/server/profile";
import { userResponse } from "@/server/serialize";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  return json(userResponse(await requireUser(req)));
});

/** Updates the signed-in user's personal details. */
export const PUT = route(async (req) => {
  const user = await requireUser(req);
  const body = await parseJson(req, profileSchema);

  const db = await getDb();
  const [updated] = await db
    .update(users)
    .set({ ...profileUpdates(body), appTag: APP_TAG })
    .where(eq(users.id, user.id))
    .returning();
  return json(userResponse(updated));
});
