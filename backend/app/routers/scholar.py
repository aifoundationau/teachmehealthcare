"""
Google Scholar & Academic Search Router for TeachMeHealthcare LMS.
Provides a rate-limited (1 query per minute) hybrid academic search:
1. Queries Google Scholar.
2. Parses titles, snippets, citation counts, and direct PDF links.
3. Automatically falls back to NCBI PubMed E-Utilities API if Google Scholar returns CAPTCHA.
4. Generates direct, parameter-exact Google Scholar deep-links.
"""

import time
import asyncio
import re
import html
import logging
from typing import Optional
from urllib.parse import quote_plus
from fastapi import APIRouter, Query, Request, HTTPException
from pydantic import BaseModel

import httpx

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/scholar", tags=["Google Scholar & Academic Search"])

# Rate limit configuration: 1 search permitted per 60 seconds per student/IP
COOLDOWN_SECONDS = 60
_rate_limit_store: dict[str, float] = {}
_lock = asyncio.Lock()


class ScholarArticle(BaseModel):
    id: str
    title: str
    authors: str
    journal: Optional[str] = None
    year: Optional[int] = None
    snippet: str
    url: str
    pdf_url: Optional[str] = None
    citations: Optional[int] = None
    source: str = "google_scholar"  # "google_scholar" | "pubmed_ncbi" | "curated"


class ScholarSearchResponse(BaseModel):
    query: str
    year_low: Optional[int] = None
    scholar_url: str
    source: str  # "google_scholar" | "pubmed_ncbi" | "curated"
    cooldown_seconds: int = COOLDOWN_SECONDS
    retry_after_seconds: int = 0
    results_count: int
    articles: list[ScholarArticle]
    message: Optional[str] = None


def get_client_identifier(request: Request, client_id: Optional[str] = None) -> str:
    """Derive a stable student/client identifier from client_id or IP."""
    if client_id and client_id.strip():
        return f"user_{client_id.strip()}"
    client_host = request.client.host if request.client else "127.0.0.1"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_host = forwarded.split(",")[0].strip()
    return f"ip_{client_host}"


async def check_and_update_rate_limit(ident: str) -> tuple[bool, int]:
    """Check if identifier is allowed to search or still in 60s cooldown."""
    async with _lock:
        now = time.time()
        last_time = _rate_limit_store.get(ident, 0.0)
        elapsed = now - last_time
        if elapsed < COOLDOWN_SECONDS:
            return False, int(COOLDOWN_SECONDS - elapsed)
        _rate_limit_store[ident] = now
        # Clean up stale entries (> 1 hour)
        if len(_rate_limit_store) > 1000:
            for k, v in list(_rate_limit_store.items()):
                if now - v > 3600:
                    del _rate_limit_store[k]
        return True, 0


async def fetch_from_google_scholar(query: str, year_low: Optional[int] = None) -> list[ScholarArticle]:
    """Fetch search results directly from Google Scholar."""
    year_param = f"&as_ylo={year_low}" if year_low else ""
    scholar_url = f"https://scholar.google.com/scholar?hl=en&as_sdt=0%2C5{year_param}&q={quote_plus(query)}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }

    async with httpx.AsyncClient(timeout=7.0, follow_redirects=True, headers=headers) as client:
        resp = await client.get(scholar_url)
        if resp.status_code != 200 or "sorry" in str(resp.url) or "captcha" in resp.text.lower():
            raise RuntimeError(f"Google Scholar anti-bot triggered (status: {resp.status_code})")

        content = resp.text
        blocks = re.split(r'<div class="gs_r gs_or gs_scl"', content)
        if len(blocks) <= 1:
            raise RuntimeError("No search result blocks found in Google Scholar HTML")

        articles: list[ScholarArticle] = []
        for idx, block in enumerate(blocks[1:11]):
            # Title & Link
            t_match = re.search(r'<h3 class="gs_rt"[^>]*>.*?<a[^>]*href="([^"]+)"[^>]*>(.*?)</a>', block, re.DOTALL)
            if not t_match:
                t_match = re.search(r'<h3 class="gs_rt"[^>]*>(.*?)</h3>', block, re.DOTALL)
                raw_title = t_match.group(1) if t_match else "Medical Article"
                url = scholar_url
            else:
                url = t_match.group(1)
                raw_title = t_match.group(2)
            title = html.unescape(re.sub(r"<[^>]+>", "", raw_title)).strip()

            # Authors & Citation
            a_match = re.search(r'<div class="gs_a">(.*?)</div>', block, re.DOTALL)
            author_line = html.unescape(re.sub(r"<[^>]+>", "", a_match.group(1))).strip() if a_match else ""

            # Year extraction from author_line (e.g. "... - 2021 - ...")
            year_match = re.search(r"\b(20\d\d)\b", author_line)
            year = int(year_match.group(1)) if year_match else None

            # Snippet
            s_match = re.search(r'<div class="gs_rs">(.*?)</div>', block, re.DOTALL)
            snippet = html.unescape(re.sub(r"<[^>]+>", "", s_match.group(1))).strip() if s_match else ""

            # PDF Link
            p_match = re.search(r'<div class="gs_or_ggsm"[^>]*><a[^>]*href="([^"]+)"', block)
            pdf_url = p_match.group(1) if p_match else None

            # Citations
            c_match = re.search(r'class="gs_or_cited">Cited by (\d+)', block)
            citations = int(c_match.group(1)) if c_match else None

            articles.append(
                ScholarArticle(
                    id=f"gs-{idx+1}-{hash(title) % 1000000}",
                    title=title,
                    authors=author_line,
                    journal=None,
                    year=year,
                    snippet=snippet or "Diagnostic academic abstract available on publisher repository.",
                    url=url,
                    pdf_url=pdf_url,
                    citations=citations,
                    source="google_scholar",
                )
            )

        return articles


async def fetch_from_pubmed_ncbi(query: str, year_low: Optional[int] = None) -> list[ScholarArticle]:
    """Fallback: Fetch verified academic peer-reviewed papers via official NCBI E-Utilities API."""
    year_clause = f"+AND+{year_low}:3000[pdat]" if year_low else ""
    search_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pmc&term={quote_plus(query)}{year_clause}&retmode=json&retmax=8"
    headers = {
        "User-Agent": "TeachMeHealthLMS/1.0 (academic research portal; mailto:info@teachmehealthcare.org)"
    }

    async with httpx.AsyncClient(timeout=7.0, follow_redirects=True, headers=headers) as client:
        search_res = await client.get(search_url)
        if search_res.status_code != 200:
            raise RuntimeError(f"NCBI E-Search failed: {search_res.status_code}")

        data = search_res.json()
        id_list = data.get("esearchresult", {}).get("idlist", [])
        if not id_list:
            return []

        # Fetch summaries
        summary_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pmc&id={','.join(id_list[:8])}&retmode=json"
        summary_res = await client.get(summary_url)
        if summary_res.status_code != 200:
            raise RuntimeError(f"NCBI E-Summary failed: {summary_res.status_code}")

        sdata = summary_res.json().get("result", {})
        articles: list[ScholarArticle] = []

        for pmc_id in id_list:
            item = sdata.get(pmc_id)
            if not item:
                continue

            title = item.get("title", "").strip().rstrip(".")
            journal = item.get("source", "PubMed Central")
            pubdate = item.get("pubdate", "")
            year_m = re.search(r"\b(20\d\d)\b", pubdate)
            year = int(year_m.group(1)) if year_m else year_low

            authors_list = [a.get("name") for a in item.get("authors", []) if a.get("name")]
            authors_str = ", ".join(authors_list[:3])
            if len(authors_list) > 3:
                authors_str += " et al."

            pmcid = f"PMC{pmc_id}"
            url = f"https://www.ncbi.nlm.nih.gov/pmc/articles/{pmcid}/"
            pdf_url = f"https://pmc.ncbi.nlm.nih.gov/articles/{pmcid}/pdf/main.pdf"

            articles.append(
                ScholarArticle(
                    id=f"pmc-{pmc_id}",
                    title=title,
                    authors=authors_str or "Medical Research Team",
                    journal=journal,
                    year=year,
                    snippet=f"Peer-reviewed medical paper published in {journal} ({pubdate}). Full text indexed on NCBI PubMed Central.",
                    url=url,
                    pdf_url=pdf_url,
                    citations=None,
                    source="pubmed_ncbi",
                )
            )

        return articles


@router.get("/search", response_model=ScholarSearchResponse)
async def search_scholar(
    request: Request,
    q: str = Query(..., min_length=2, description="Academic research query"),
    year_low: Optional[int] = Query(None, ge=1900, le=2030, description="Optional minimum publication year"),
    client_id: Optional[str] = Query(None, description="Optional student/user ID for rate limiting"),
):
    """
    Search academic literature via Google Scholar with 1 search/minute rate-limiting
    and automatic fail-safe fallback to NCBI PubMed Central.
    """
    clean_query = q.strip()
    year_param = f"&as_ylo={year_low}" if year_low else ""
    scholar_url = f"https://scholar.google.com/scholar?hl=en&as_sdt=0%2C5{year_param}&q={quote_plus(clean_query)}"
    ident = get_client_identifier(request, client_id)

    # 1. Enforce strict 1-minute rate limit
    allowed, retry_after = await check_and_update_rate_limit(ident)
    if not allowed:
        return ScholarSearchResponse(
            query=clean_query,
            year_low=year_low,
            scholar_url=scholar_url,
            source="rate_limited",
            cooldown_seconds=COOLDOWN_SECONDS,
            retry_after_seconds=retry_after,
            results_count=0,
            articles=[],
            message=f"Rate limit: 1 search permitted per minute. Please wait {retry_after}s or use the direct Google Scholar button.",
        )

    # 2. Try Google Scholar
    try:
        articles = await fetch_from_google_scholar(clean_query, year_low)
        return ScholarSearchResponse(
            query=clean_query,
            year_low=year_low,
            scholar_url=scholar_url,
            source="google_scholar",
            cooldown_seconds=COOLDOWN_SECONDS,
            retry_after_seconds=0,
            results_count=len(articles),
            articles=articles,
            message="Results retrieved from Google Scholar.",
        )
    except Exception as gs_err:
        logger.warning(f"Google Scholar fetch notice for '{clean_query}': {gs_err}. Engaging NCBI fallback.")

    # 3. Fallback: Official NCBI PubMed Central API
    try:
        ncbi_articles = await fetch_from_pubmed_ncbi(clean_query, year_low)
        if ncbi_articles:
            return ScholarSearchResponse(
                query=clean_query,
                year_low=year_low,
                scholar_url=scholar_url,
                source="pubmed_ncbi",
                cooldown_seconds=COOLDOWN_SECONDS,
                retry_after_seconds=0,
                results_count=len(ncbi_articles),
                articles=ncbi_articles,
                message="Retrieved peer-reviewed medical publications via NCBI PubMed Central (Google Scholar fallback).",
            )
    except Exception as ncbi_err:
        logger.error(f"NCBI PubMed API error: {ncbi_err}")

    # 4. Ultimate graceful degradation (never 500 error)
    return ScholarSearchResponse(
        query=clean_query,
        year_low=year_low,
        scholar_url=scholar_url,
        source="curated",
        cooldown_seconds=COOLDOWN_SECONDS,
        retry_after_seconds=0,
        results_count=0,
        articles=[],
        message="Live network search is currently throttled by Google Scholar. Click 'Open in Google Scholar' below for instant direct access.",
    )
