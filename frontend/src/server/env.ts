/** Server-side configuration. None of these values are sent to the browser. */

export const APP_TAG = "healthlms";

export const env = {
  /** Postgres connection string. When unset outside Vercel, a local PGlite database is used instead. */
  databaseUrl: process.env.DATABASE_URL,
  pgliteDir: process.env.PGLITE_DIR ?? (process.platform === "win32" ? "memory://" : "./.data/pglite"),

  firebaseProjectId:
    process.env.FIREBASE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    "ai-foundation-firebase",

  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-3.8-flash",
  geminiEmbeddingModel: process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-2",

  imgbbApiKey: process.env.IMGBB_API_KEY ?? "",
  /** ImgBB rejects files over 32 MB. On Vercel, request bodies are also capped at 4.5 MB. */
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB ?? 32),

  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripePublishableKey:
    process.env.STRIPE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",

  /** Public site URL used for Stripe redirects. Defaults to the origin of the incoming request. */
  appUrl: process.env.APP_URL,
};
