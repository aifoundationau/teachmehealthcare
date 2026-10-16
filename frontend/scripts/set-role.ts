/**
 * Changes a user's role. New accounts are supporters; doctors and admins can upload
 * scans and add annotations. The person must have signed in at least once.
 *
 *   npm run set-role -- someone@example.com doctor
 *
 * Roles: supporter, student, doctor, admin. Uses DATABASE_URL from the environment or
 * .env.local, or the local PGlite database when it's unset.
 */

import { loadEnv } from "./load-env";

async function main() {
  loadEnv();
  const [email, role] = process.argv.slice(2);
  const { ROLES } = await import("../src/server/validation");
  if (!email || !ROLES.includes(role as (typeof ROLES)[number])) {
    console.error(`Usage: npm run set-role -- <email> <${ROLES.join("|")}>`);
    process.exit(1);
  }

  const { eq } = await import("drizzle-orm");
  const { getDb } = await import("../src/server/db");
  const { users } = await import("../src/server/db/schema");

  const db = await getDb();
  const [user] = await db
    .update(users)
    .set({ role })
    .where(eq(users.email, email.trim().toLowerCase()))
    .returning();
  if (!user) {
    console.error(`No account for ${email}. They need to sign in to the site once first.`);
    process.exit(1);
  }
  console.log(`${user.email} is now ${user.role}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
