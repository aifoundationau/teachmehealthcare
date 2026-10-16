import { z } from "zod";

import { answerQuestion, withDisclaimer } from "@/server/ai";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { searchSimilar } from "@/server/embeddings";
import { json, parseJson, route } from "@/server/http";
import { requiredText } from "@/server/validation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Sources less similar than this aren't used for answers (data-contracts.md, section 4). */
const MIN_SIMILARITY = 0.65;

const NOT_ENOUGH_CONTEXT =
  "I don't have enough information in the knowledge base to answer this question yet. " +
  "As more medical images are uploaded and annotated by doctors, the knowledge base will grow. " +
  "Please try a different question or check back later.";

const askSchema = z.object({
  question: requiredText(2, 1000),
  modality: z.string().nullish(),
  body_region: z.string().nullish(),
  finding_type: z.string().nullish(),
  top_k: z.number().int().min(1).max(50).default(10),
});

/** Answers a question from doctors' annotations, comments and past analyses (RAG). */
export const POST = route(async (req) => {
  await requireUser(req);
  const body = await parseJson(req, askSchema);
  const db = await getDb();

  const hits = await searchSimilar(db, body.question, body.top_k, {
    modality: body.modality ?? undefined,
    bodyRegion: body.body_region ?? undefined,
    findingType: body.finding_type ?? undefined,
  });
  const relevant = hits.filter((hit) => hit.similarity_score >= MIN_SIMILARITY);
  if (!relevant.length) return json({ answer: withDisclaimer(NOT_ENOUGH_CONTEXT), sources: [] });

  const answer = await answerQuestion(body.question, relevant);
  return json({
    answer,
    sources: relevant.slice(0, 5).map((hit) => ({
      image_id: hit.image_id,
      image_title: hit.image_title,
      content_type: hit.content_type,
      content_text: hit.content_text.slice(0, 300),
      similarity_score: hit.similarity_score,
    })),
  });
});
