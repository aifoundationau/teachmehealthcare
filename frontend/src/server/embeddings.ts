/** Stores and searches the vector embeddings behind semantic search and AI answers. */

import { and, cosineDistance, eq, ilike, sql, type SQL } from "drizzle-orm";

import { embed, type RagSource } from "./ai";
import type { Database } from "./db";
import { embeddings, medicalImages } from "./db/schema";

export type ContentType = "annotation" | "comment" | "ai_analysis";

/**
 * Embeds and stores text for search. Failures are logged, not thrown, so the
 * annotation or comment is still saved when the AI service is down or not configured.
 */
export async function storeEmbedding(
  db: Database,
  item: {
    contentType: ContentType;
    contentId: number;
    contentText: string;
    imageId: number;
    metadata: Record<string, string>;
  },
) {
  try {
    const vector = await embed(item.contentText, "document");
    await db.insert(embeddings).values({ ...item, embedding: vector });
  } catch (err) {
    console.warn(`[embeddings] Skipped ${item.contentType}:${item.contentId}:`, err instanceof Error ? err.message : err);
  }
}

export async function deleteEmbeddings(db: Database, contentType: ContentType, contentId: number) {
  await db
    .delete(embeddings)
    .where(and(eq(embeddings.contentType, contentType), eq(embeddings.contentId, contentId)));
}

export interface SearchFilters {
  modality?: string;
  bodyRegion?: string;
  findingType?: string;
}

export interface SearchHit extends RagSource {
  image_thumbnail: string | null;
  finding_type: string | null;
  body_region: string;
  modality: string;
}

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`);

export async function searchSimilar(
  db: Database,
  query: string,
  topK: number,
  filters: SearchFilters,
): Promise<SearchHit[]> {
  const queryVector = await embed(query, "query");
  const distance = cosineDistance(embeddings.embedding, queryVector);

  const conditions: SQL[] = [];
  if (filters.modality) conditions.push(eq(medicalImages.modality, filters.modality));
  if (filters.bodyRegion) conditions.push(ilike(medicalImages.bodyRegion, `%${escapeLike(filters.bodyRegion)}%`));
  if (filters.findingType) conditions.push(sql`${embeddings.metadata}->>'finding_type' = ${filters.findingType}`);

  const rows = await db
    .select({
      contentType: embeddings.contentType,
      contentText: embeddings.contentText,
      imageId: embeddings.imageId,
      metadata: embeddings.metadata,
      imageTitle: medicalImages.title,
      imageThumbnail: medicalImages.thumbnailPath,
      modality: medicalImages.modality,
      bodyRegion: medicalImages.bodyRegion,
      distance: sql<number>`${distance}`.mapWith(Number),
    })
    .from(embeddings)
    .innerJoin(medicalImages, eq(embeddings.imageId, medicalImages.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(distance)
    .limit(topK);

  return rows.map((row) => ({
    image_id: row.imageId,
    image_title: row.imageTitle,
    image_thumbnail: row.imageThumbnail,
    content_type: row.contentType,
    content_text: row.contentText,
    similarity_score: Math.round((1 - row.distance) * 10_000) / 10_000,
    finding_type: row.metadata?.finding_type ?? null,
    body_region: row.bodyRegion,
    modality: row.modality,
  }));
}
