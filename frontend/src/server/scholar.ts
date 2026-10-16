/**
 * Academic search: Google Scholar first, then NCBI PubMed Central when Scholar
 * blocks the request (it usually does from cloud servers).
 */

export const SCHOLAR_COOLDOWN_SECONDS = 60;

export type ScholarSource = "google_scholar" | "pubmed_ncbi" | "curated";

export interface ScholarArticle {
  id: string;
  title: string;
  authors: string;
  journal: string | null;
  year: number | null;
  snippet: string;
  url: string;
  pdf_url: string | null;
  citations: number | null;
  source: ScholarSource;
}

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};
const NCBI_HEADERS = {
  "User-Agent": "TeachMeHealthLMS/1.0 (academic research portal; mailto:info@teachmehealthcare.org)",
};
const TIMEOUT_MS = 7_000;

export function scholarSearchUrl(query: string, yearLow?: number): string {
  const params = new URLSearchParams({ hl: "en", as_sdt: "0,5" });
  if (yearLow) params.set("as_ylo", String(yearLow));
  params.set("q", query);
  return `https://scholar.google.com/scholar?${params}`;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  ndash: "–",
  mdash: "—",
};

function decodeHtml(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

const stripTags = (html: string) => decodeHtml(html.replace(/<[^>]+>/g, "")).trim();

function hashCode(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(hash) % 1_000_000;
}

export async function fetchFromGoogleScholar(query: string, yearLow?: number): Promise<ScholarArticle[]> {
  const url = scholarSearchUrl(query, yearLow);
  const res = await fetch(url, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(TIMEOUT_MS) });
  const html = await res.text();
  if (res.status !== 200 || res.url.includes("sorry") || html.toLowerCase().includes("captcha")) {
    throw new Error(`Google Scholar anti-bot triggered (status: ${res.status})`);
  }

  const blocks = html.split('<div class="gs_r gs_or gs_scl"');
  if (blocks.length <= 1) throw new Error("No search result blocks found in Google Scholar HTML");

  return blocks.slice(1, 11).map((block, idx) => {
    const linked = block.match(/<h3 class="gs_rt"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    const unlinked = linked ? null : block.match(/<h3 class="gs_rt"[^>]*>([\s\S]*?)<\/h3>/);
    const title = stripTags(linked ? linked[2] : (unlinked?.[1] ?? "Medical Article"));

    const authorMatch = block.match(/<div class="gs_a">([\s\S]*?)<\/div>/);
    const authors = authorMatch ? stripTags(authorMatch[1]) : "";
    const yearMatch = authors.match(/\b(20\d\d)\b/);
    const snippetMatch = block.match(/<div class="gs_rs">([\s\S]*?)<\/div>/);
    const pdfMatch = block.match(/<div class="gs_or_ggsm"[^>]*><a[^>]*href="([^"]+)"/);
    const citedMatch = block.match(/class="gs_or_cited">Cited by (\d+)/);

    return {
      id: `gs-${idx + 1}-${hashCode(title)}`,
      title,
      authors,
      journal: null,
      year: yearMatch ? Number(yearMatch[1]) : null,
      snippet:
        (snippetMatch && stripTags(snippetMatch[1])) || "Diagnostic academic abstract available on publisher repository.",
      url: linked ? decodeHtml(linked[1]) : url,
      pdf_url: pdfMatch ? decodeHtml(pdfMatch[1]) : null,
      citations: citedMatch ? Number(citedMatch[1]) : null,
      source: "google_scholar",
    };
  });
}

interface NcbiSummary {
  title?: string;
  source?: string;
  pubdate?: string;
  authors?: { name?: string }[];
}

export async function fetchFromPubmedCentral(query: string, yearLow?: number): Promise<ScholarArticle[]> {
  const term = yearLow ? `${query} AND ${yearLow}:3000[pdat]` : query;
  const searchParams = new URLSearchParams({ db: "pmc", term, retmode: "json", retmax: "8" });
  const searchRes = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${searchParams}`, {
    headers: NCBI_HEADERS,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!searchRes.ok) throw new Error(`NCBI E-Search failed: ${searchRes.status}`);
  const ids: string[] = (await searchRes.json())?.esearchresult?.idlist ?? [];
  if (!ids.length) return [];

  const summaryParams = new URLSearchParams({ db: "pmc", id: ids.slice(0, 8).join(","), retmode: "json" });
  const summaryRes = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?${summaryParams}`, {
    headers: NCBI_HEADERS,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!summaryRes.ok) throw new Error(`NCBI E-Summary failed: ${summaryRes.status}`);
  const summaries: Record<string, NcbiSummary> = (await summaryRes.json())?.result ?? {};

  const articles: ScholarArticle[] = [];
  for (const pmcId of ids) {
    const item = summaries[pmcId];
    if (!item) continue;

    const journal = item.source || "PubMed Central";
    const pubdate = item.pubdate ?? "";
    const yearMatch = pubdate.match(/\b(20\d\d)\b/);
    const names = (item.authors ?? []).map((a) => a.name).filter((n): n is string => !!n);
    const pmcid = `PMC${pmcId}`;

    articles.push({
      id: `pmc-${pmcId}`,
      title: (item.title ?? "").trim().replace(/\.$/, ""),
      authors: (names.slice(0, 3).join(", ") + (names.length > 3 ? " et al." : "")) || "Medical Research Team",
      journal,
      year: yearMatch ? Number(yearMatch[1]) : (yearLow ?? null),
      snippet: `Peer-reviewed medical paper published in ${journal} (${pubdate}). Full text indexed on NCBI PubMed Central.`,
      url: `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcid}/`,
      pdf_url: `https://pmc.ncbi.nlm.nih.gov/articles/${pmcid}/pdf/main.pdf`,
      citations: null,
      source: "pubmed_ncbi",
    });
  }
  return articles;
}
