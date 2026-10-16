import { z } from "zod";

import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { searchSimilar } from "@/server/embeddings";
import { json, parseQuery, route } from "@/server/http";

export const dynamic = "force-dynamic";

const searchQuery = z.object({
  q: z.string().trim().min(2).max(1000),
  modality: z.string().optional(),
  body_region: z.string().optional(),
  finding_type: z.string().optional(),
  top_k: z.coerce.number().int().min(1).max(50).default(20),
});

/** Semantic search across annotations, comments and AI analyses. */
export const GET = route(async (req) => {
  await requireUser(req);
  const query = parseQuery(req, searchQuery);
  const db = await getDb();
  return json(
    await searchSimilar(db, query.q, query.top_k, {
      modality: query.modality,
      bodyRegion: query.body_region,
      findingType: query.finding_type,
    }),
  );
});
