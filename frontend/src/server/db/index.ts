import fs from "node:fs";
import path from "node:path";

import { drizzle as drizzlePostgres, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "../env";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __tmhDb?: Promise<Database> };

/**
 * Returns the shared database connection, opening it on first use.
 *
 * With DATABASE_URL set, connects to that Postgres server (run `npm run db:migrate` first).
 * Without it, local development uses an embedded PGlite database in PGLITE_DIR,
 * migrated automatically, so no Postgres install is needed.
 */
export function getDb(): Promise<Database> {
  globalForDb.__tmhDb ??= connect().catch((err) => {
    globalForDb.__tmhDb = undefined;
    throw err;
  });
  return globalForDb.__tmhDb;
}

async function connect(): Promise<Database> {
  if (env.databaseUrl) {
    // prepare: false keeps this compatible with transaction-mode poolers (Neon, Supabase).
    const client = postgres(env.databaseUrl, { max: 5, prepare: false });
    return drizzlePostgres(client, { schema });
  }

  if (process.env.VERCEL) {
    throw new Error(
      "DATABASE_URL is not set. Add a Postgres connection string in the Vercel project settings.",
    );
  }

  const [{ PGlite }, { vector }, { drizzle: drizzlePglite }, { migrate }] = await Promise.all([
    import("@electric-sql/pglite"),
    import("@electric-sql/pglite-pgvector"),
    import("drizzle-orm/pglite"),
    import("drizzle-orm/pglite/migrator"),
  ]);

  if (!env.pgliteDir.startsWith("memory://")) fs.mkdirSync(env.pgliteDir, { recursive: true });
  const client = new PGlite(env.pgliteDir, { extensions: { vector } });
  const db = drizzlePglite(client, { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

  // Both drivers expose the same query builder; only raw `execute()` results differ, and we don't use them.
  return db as unknown as Database;
}
