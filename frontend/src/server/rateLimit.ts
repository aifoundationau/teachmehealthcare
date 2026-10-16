import { eq, lt } from "drizzle-orm";

import type { Database } from "./db";
import { rateLimits } from "./db/schema";

/**
 * Allows one request per `cooldownSeconds` for each key. The check-and-claim is a single
 * upsert, so concurrent requests on different serverless instances can't both get through.
 */
export async function claimRateLimit(
  db: Database,
  key: string,
  cooldownSeconds: number,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - cooldownSeconds * 1000);

  const claimed = await db
    .insert(rateLimits)
    .values({ key, lastAt: now })
    .onConflictDoUpdate({ target: rateLimits.key, set: { lastAt: now }, setWhere: lt(rateLimits.lastAt, cutoff) })
    .returning({ key: rateLimits.key });
  if (claimed.length) return { allowed: true, retryAfterSeconds: 0 };

  const [row] = await db.select().from(rateLimits).where(eq(rateLimits.key, key));
  const remainingMs = (row?.lastAt.getTime() ?? 0) + cooldownSeconds * 1000 - now.getTime();
  return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / 1000)) };
}
