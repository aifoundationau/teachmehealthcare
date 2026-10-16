/**
 * Applies database migrations to the Postgres server in DATABASE_URL:
 *
 *   npm run db:migrate
 *
 * DATABASE_URL is read from the environment or .env.local. Run this once when setting up
 * a database and again after pulling schema changes. (The local PGlite database used
 * when DATABASE_URL is unset migrates itself.)
 */

import { loadEnv } from "./load-env";

async function main() {
  loadEnv();
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Add it to .env.local or the environment first.");
    process.exit(1);
  }

  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");

  const client = postgres(url, { max: 1 });
  try {
    await migrate(drizzle(client), { migrationsFolder: "drizzle" });
    console.log("Database is up to date.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
