This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Backend (API)

The API lives in this app: route handlers under `src/app/api/`, shared server code under `src/server/`. It replaces the old FastAPI service in `backend/`.

- **Sign-in:** the browser sends the user's Firebase ID token (`src/lib/api.ts`); the server verifies it against Google's keys on every request. New accounts are supporters.
- **Database:** Postgres with pgvector via Drizzle (`src/server/db/schema.ts`). Without `DATABASE_URL`, local development uses an embedded PGlite database in `.data/pglite`, created automatically.
- **Settings:** see `.env.example`. Server keys (`GEMINI_API_KEY`, `IMGBB_API_KEY`, `STRIPE_SECRET_KEY`, `DATABASE_URL`) must not use the `NEXT_PUBLIC_` prefix.

| Command | What it does |
| --- | --- |
| `npm run db:migrate` | Applies migrations in `drizzle/` to the database in `DATABASE_URL` (run once per new database and after schema changes) |
| `npm run db:generate` | Creates a migration after editing `src/server/db/schema.ts` |
| `npm run set-role -- someone@example.com doctor` | Changes a user's role (`supporter`, `student`, `doctor`, `admin`); they must have signed in once |
| `npm run test:api` | Runs the API checks against a throwaway in-memory database; no external services are called |

Deploying to Vercel: create a Postgres database with pgvector (e.g. Neon), set the server settings above in the Vercel project, and run `npm run db:migrate` with that `DATABASE_URL`. Vercel limits request bodies to 4.5 MB, so larger scan uploads fail there.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
