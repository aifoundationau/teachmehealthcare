/**
 * Academic search: Google Scholar first, then NCBI PubMed when Scholar
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
  /** Full abstract, when the source provides one (PubMed does; Scholar only gives a snippet). */
  abstract: string | null;
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
const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
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
    // Look for the title link inside the heading only: for results without one ([CITATION] entries)
    // a wider match picks up the next link in the block, such as "Save" or an author profile.
    const heading = block.match(/<h3 class="gs_rt"[^>]*>([\s\S]*?)<\/h3>/)?.[1] ?? "";
    const linked = heading.match(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    // Drop the type markers that precede an unlinked title, e.g. [CITATION].
    const title =
      stripTags(linked ? linked[2] : heading.replace(/<span class="gs_ct[12]">[\s\S]*?<\/span>/g, "")) ||
      "Medical Article";

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
      abstract: null,
      // Without a link of its own, send the reader to this exact title on Scholar.
      url: linked ? new URL(decodeHtml(linked[1]), "https://scholar.google.com").href : scholarSearchUrl(`"${title}"`),
      pdf_url: pdfMatch ? decodeHtml(pdfMatch[1]) : null,
      citations: citedMatch ? Number(citedMatch[1]) : null,
      source: "google_scholar",
    };
  });
}

/** Text of the first `<tag>` element in a piece of PubMed XML, or "" when there is none. */
function xmlText(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`));
  return match ? stripTags(match[1]).replace(/\s+/g, " ") : "";
}

/** One <PubmedArticle> (or <PubmedBookArticle>) record from E-Fetch. */
function parsePubmedRecord(record: string): ScholarArticle | null {
  const pmid = xmlText(record, "PMID");
  if (!pmid) return null;

  const title = (xmlText(record, "ArticleTitle") || xmlText(record, "BookTitle")).replace(/\.$/, "");
  // Books list their editors first; skip them.
  const authorList = record.match(/<AuthorList(?![^>]*Type="editors")[^>]*>([\s\S]*?)<\/AuthorList>/)?.[1] ?? "";
  const names = Array.from(authorList.matchAll(/<Author\b[^>]*>([\s\S]*?)<\/Author>/g), ([, author]) => {
    const lastName = xmlText(author, "LastName");
    return lastName ? `${lastName} ${xmlText(author, "Initials")}`.trim() : xmlText(author, "CollectiveName");
  }).filter(Boolean);
  const abstractXml = record.match(/<Abstract>([\s\S]*?)<\/Abstract>/)?.[1] ?? "";
  const abstract = Array.from(abstractXml.matchAll(/<AbstractText([^>]*)>([\s\S]*?)<\/AbstractText>/g), ([, attrs, text]) => {
    const label = attrs.match(/Label="([^"]+)"/)?.[1];
    const body = stripTags(text).replace(/\s+/g, " ");
    return label ? `${label}: ${body}` : body;
  }).join("\n\n");
  const flatAbstract = abstract.replace(/\s+/g, " ");
  // Each cited reference has an <ArticleIdList> too; the record's own list comes first.
  const articleIds = record.match(/<ArticleIdList>([\s\S]*?)<\/ArticleIdList>/)?.[1] ?? "";
  const pmcid = articleIds.match(/<ArticleId IdType="pmc">(PMC\d+)<\/ArticleId>/)?.[1];
  const year = xmlText(record, "PubDate").match(/\d{4}/)?.[0];

  return {
    id: `pubmed-${pmid}`,
    title,
    authors: (names.slice(0, 3).join(", ") + (names.length > 3 ? " et al." : "")) || "No authors listed",
    journal: xmlText(record, "ISOAbbreviation") || xmlText(record, "Title") || xmlText(record, "BookTitle") || null,
    year: year ? Number(year) : null,
    snippet:
      flatAbstract.length > 300
        ? `${flatAbstract.slice(0, 300).replace(/\s+\S*$/, "")}…`
        : flatAbstract || "No abstract available on PubMed.",
    abstract: abstract || null,
    url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    // Only articles with free full text in PubMed Central have a PDF to offer.
    pdf_url: pmcid ? `https://pmc.ncbi.nlm.nih.gov/articles/${pmcid}/pdf/main.pdf` : null,
    citations: null,
    source: "pubmed_ncbi",
  };
}

export async function fetchFromPubmed(query: string, yearLow?: number): Promise<ScholarArticle[]> {
  const term = yearLow ? `(${query}) AND ${yearLow}:3000[pdat]` : query;
  // "Best Match" order: by default E-Search lists the most recently added matches first, however loosely they match.
  const searchParams = new URLSearchParams({ db: "pubmed", term, sort: "relevance", retmode: "json", retmax: "8" });
  const searchRes = await fetch(`${EUTILS}/esearch.fcgi?${searchParams}`, {
    headers: NCBI_HEADERS,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!searchRes.ok) throw new Error(`NCBI E-Search failed: ${searchRes.status}`);
  const ids: string[] = (await searchRes.json())?.esearchresult?.idlist ?? [];
  if (!ids.length) return [];

  const fetchParams = new URLSearchParams({ db: "pubmed", id: ids.join(","), retmode: "xml" });
  const fetchRes = await fetch(`${EUTILS}/efetch.fcgi?${fetchParams}`, {
    headers: NCBI_HEADERS,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!fetchRes.ok) throw new Error(`NCBI E-Fetch failed: ${fetchRes.status}`);
  const articles = new Map<string, ScholarArticle>();
  for (const record of (await fetchRes.text()).split(/<PubmedArticle>|<PubmedBookArticle>/).slice(1)) {
    const article = parsePubmedRecord(record);
    if (article) articles.set(article.id, article);
  }
  // Keep E-Search's relevance order.
  return ids.flatMap((id) => articles.get(`pubmed-${id}`) ?? []);
}
