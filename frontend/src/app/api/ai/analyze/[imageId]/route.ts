import { eq } from "drizzle-orm";

import { analyzeImage } from "@/server/ai";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { medicalImages } from "@/server/db/schema";
import { storeEmbedding } from "@/server/embeddings";
import { json, parseId, route } from "@/server/http";
import { downloadHostedImage } from "@/server/imgbb";
import { findImage } from "@/server/images";

export const dynamic = "force-dynamic";
// Image analysis can take a while; allow up to 60s on Vercel.
export const maxDuration = 60;

/** Runs Gemini analysis on an image once, then serves the cached result. */
export const POST = route<{ imageId: string }>(async (req, { params }) => {
  await requireUser(req);
  const db = await getDb();
  const image = await findImage(db, parseId(params.imageId, "Image not found"));

  if (image.aiAnalysis) return json({ image_id: image.id, analysis: image.aiAnalysis, cached: true });

  const file = await downloadHostedImage(image.filePath);
  const analysis = await analyzeImage(file.data, file.mimeType);
  await db.update(medicalImages).set({ aiAnalysis: analysis }).where(eq(medicalImages.id, image.id));

  await storeEmbedding(db, {
    contentType: "ai_analysis",
    contentId: image.id,
    contentText: analysis,
    imageId: image.id,
    metadata: { body_region: image.bodyRegion, modality: image.modality },
  });
  return json({ image_id: image.id, analysis, cached: false });
});
