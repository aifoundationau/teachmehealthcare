/** Loads .env.local and .env into process.env for command-line scripts, the way Next.js does. */
export function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      process.loadEnvFile(file);
    } catch {
      // File doesn't exist; that's fine.
    }
  }
}
