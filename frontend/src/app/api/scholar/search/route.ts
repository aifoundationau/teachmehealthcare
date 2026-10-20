import { z } from "zod";

import { getDb } from "@/server/db";
import { json, parseQuery, route } from "@/server/http";
import { claimRateLimit } from "@/server/rateLimit";
import {
  SCHOLAR_COOLDOWN_SECONDS,
  fetchFromGoogleScholar,
  fetchFromPubmed,
  scholarSearchUrl,
  type ScholarArticle,
} from "@/server/scholar";

export const dynamic = "force-dynamic";

const scholarQuery = z.object({
  q: z.string().trim().min(2).max(500),
  year_low: z.coerce.number().int().min(1900).max(2030).optional(),
  client_id: z.string().trim().max(128).optional(),
});

/**
 * Academic search, limited to one search per minute per student (or per IP address).
 * Never fails outright: when both sources are unavailable it returns no articles and a
 * direct Google Scholar link.
 */
export const GET = route(async (req) => {
  const { q, year_low: yearLow, client_id: clientId } = parseQuery(req, scholarQuery);
  const scholarUrl = scholarSearchUrl(q, yearLow);
  const respond = (
    source: string,
    articles: ScholarArticle[],
    message: string,
    retryAfterSeconds = 0,
  ) =>
    json({
      query: q,
      year_low: yearLow ?? null,
      scholar_url: scholarUrl,
      source,
      cooldown_seconds: SCHOLAR_COOLDOWN_SECONDS,
      retry_after_seconds: retryAfterSeconds,
      results_count: articles.length,
      articles,
      message,
    });

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "127.0.0.1";
  const key = clientId ? `scholar:user_${clientId}` : `scholar:ip_${ip}`;
  const db = await getDb();
  const limit = await claimRateLimit(db, key, SCHOLAR_COOLDOWN_SECONDS);
  if (!limit.allowed) {
    return respond(
      "rate_limited",
      [],
      `Rate limit: 1 search permitted per minute. Please wait ${limit.retryAfterSeconds}s or use the direct Google Scholar button.`,
      limit.retryAfterSeconds,
    );
  }

  try {
    const articles = await fetchFromGoogleScholar(q, yearLow);
    return respond("google_scholar", articles, "Results retrieved from Google Scholar.");
  } catch (err) {
    console.warn(`[scholar] Google Scholar unavailable for "${q}": ${err instanceof Error ? err.message : err}. Using NCBI.`);
  }

  try {
    const articles = await fetchFromPubmed(q, yearLow);
    if (articles.length) {
      return respond("pubmed_ncbi", articles, "Results retrieved from NCBI PubMed (Google Scholar was unavailable).");
    }
  } catch (err) {
    console.error("[scholar] NCBI PubMed API error:", err);
  }

  return respond(
    "curated",
    [],
    "Live network search is currently throttled by Google Scholar. Click 'Open in Google Scholar' below for instant direct access.",
  );
});
