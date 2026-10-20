"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  ExternalLink,
  X,
  FileText,
  CheckCircle2,
  Search,
  Clock,
  Sparkles,
  Download,
  AlertCircle,
  RotateCcw
} from "lucide-react";
import { AcademicArticle } from "@/lib/medicalData";
import { apiFetch } from "@/lib/api";
import { readStorage, writeStorage } from "@/lib/storage";

export interface ScholarArticleResult {
  id: string;
  title: string;
  authors: string;
  journal?: string;
  year?: number;
  snippet: string;
  url: string;
  pdf_url?: string;
  citations?: number;
  source: "google_scholar" | "pubmed_ncbi" | "curated";
}

interface AcademicResearchProps {
  articles: AcademicArticle[];
  activeCondition?: string;
}

export default function AcademicResearch({
  articles,
  activeCondition,
}: AcademicResearchProps) {
  // Search query & results state
  const [searchQuery, setSearchQuery] = useState(activeCondition || "");
  const [scholarResults, setScholarResults] = useState<ScholarArticleResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchSource, setSearchSource] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // 60-Second Rate Limiter & Cooldown timer
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Selected article for abstract modal
  const [activeArticle, setActiveArticle] = useState<{
    title: string;
    authors: string;
    journal?: string;
    year?: number | string;
    abstract: string;
    url: string;
    pdf_url?: string;
    pmid?: string;
    doi?: string;
    source: string;
  } | null>(null);

  // Sync searchQuery when activeCondition changes if user hasn't typed
  useEffect(() => {
    if (activeCondition && !scholarResults) {
      setSearchQuery(activeCondition);
    }
  }, [activeCondition, scholarResults]);

  // Restore & manage local 60-second cooldown timer
  useEffect(() => {
    const lastSearch = readStorage("tmh_last_scholar_search");
    if (lastSearch) {
      const elapsed = Math.floor((Date.now() - parseInt(lastSearch, 10)) / 1000);
      if (elapsed < 60) {
        setCooldownRemaining(60 - elapsed);
      }
    }

    timerRef.current = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Compute canonical Google Scholar URL for the current query
  const currentQueryTerm = searchQuery.trim() || activeCondition || "pneumonia diagnosis";
  const directScholarUrl = `https://scholar.google.com/scholar?hl=en&as_sdt=0%2C5&q=${encodeURIComponent(
    currentQueryTerm
  )}`;

  // Handle Search Submission with Rate Limiting
  const handleScholarSearch = async (e?: React.FormEvent, overrideTerm?: string) => {
    if (e) e.preventDefault();
    const term = (overrideTerm || searchQuery).trim();
    if (!term) return;

    if (cooldownRemaining > 0) {
      setStatusMessage(
        `Rate limit: 1 search allowed per minute. Please wait ${cooldownRemaining}s, or click "Open in Google Scholar" below for immediate search.`
      );
      return;
    }

    setIsSearching(true);
    setStatusMessage(null);

    // Save cooldown timestamp in local storage
    const now = Date.now();
    writeStorage("tmh_last_scholar_search", now.toString());
    setCooldownRemaining(60);

    try {
      const res = await apiFetch(`/scholar/search?q=${encodeURIComponent(term)}`);

      if (!res.ok) {
        throw new Error(`Academic search failed (${res.status})`);
      }

      const data = await res.json();

      if (data.source === "rate_limited") {
        setCooldownRemaining(data.retry_after_seconds || 60);
        setStatusMessage(data.message || "Rate limit: 1 search permitted per minute.");
        return;
      }

      if (data.articles && data.articles.length > 0) {
        setScholarResults(data.articles);
        setSearchSource(data.source);
        setStatusMessage(data.message || `Found ${data.articles.length} academic articles.`);
      } else {
        setScholarResults([]);
        setStatusMessage(
          data.message ||
            "No direct results found. Click 'Open in Google Scholar' for external index."
        );
      }
    } catch (err: any) {
      console.warn("Scholar API notice:", err);
      // Graceful degradation: show helpful message and keep direct link operational
      setStatusMessage(
        "Direct Google Scholar search connection is throttled. Use 'Open in Google Scholar' for instant access."
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setScholarResults(null);
    setSearchSource(null);
    setStatusMessage(null);
    if (activeCondition) {
      setSearchQuery(activeCondition);
    }
  };

  return (
    <div className="flex flex-col bg-[#101722] rounded-xl border border-[#1b2636] shadow-md overflow-hidden text-xs">
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-[#141d2b] border-b border-[#1b2636] flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-white tracking-wide uppercase text-[11px] sm:text-xs">
              ACADEMIC RESEARCH & SCHOLAR
            </h2>
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-2">
            <span>Google Scholar &bull; NCBI PubMed Central</span>
            <span className="text-emerald-400 font-medium">1 Search/Min Limit</span>
          </div>
        </div>
        <BookOpen className="w-4 h-4 text-cyan-400/80 shrink-0" />
      </div>

      {/* Google Scholar Search Bar */}
      <div className="p-3 bg-[#0d141f] border-b border-[#1b2636] space-y-2">
        <form onSubmit={(e) => handleScholarSearch(e)} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics (e.g., Pneumonia x-ray, Pleural effusion...)"
              className="w-full bg-[#131c2a] border border-[#223145] rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
            />
          </div>

          {/* Search Button with Rate Limit Countdown */}
          <button
            type="submit"
            disabled={isSearching || cooldownRemaining > 0}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 shrink-0 shadow ${
              cooldownRemaining > 0
                ? "bg-[#182332] text-gray-400 border border-[#223145] cursor-not-allowed"
                : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/30"
            }`}
            title={
              cooldownRemaining > 0
                ? `1 search per minute allowed. Next search in ${cooldownRemaining}s`
                : "Search Google Scholar (1 search per minute)"
            }
          >
            {isSearching ? (
              <>
                <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Searching...</span>
              </>
            ) : cooldownRemaining > 0 ? (
              <>
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Wait {cooldownRemaining}s</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Search Scholar</span>
              </>
            )}
          </button>

          {/* Direct 1-Click Launch into Google Scholar */}
          <a
            href={directScholarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-lg bg-[#182332] hover:bg-[#202e42] text-cyan-400 hover:text-cyan-200 border border-cyan-800/40 text-xs font-medium transition-colors flex items-center gap-1 shrink-0"
            title="Open search directly in Google Scholar (uninhibited)"
          >
            <span className="hidden sm:inline">Google Scholar</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          {scholarResults !== null && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#182332] transition-colors"
              title="Reset to cohort articles"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Cooldown progress indicator when active */}
        {cooldownRemaining > 0 && (
          <div className="w-full bg-[#182332] rounded-full h-1 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-cyan-500 h-1 transition-all duration-1000"
              style={{ width: `${((60 - cooldownRemaining) / 60) * 100}%` }}
            />
          </div>
        )}

        {/* Status / Alert Message */}
        {statusMessage && (
          <div className="text-[11px] px-2.5 py-1.5 rounded-md bg-[#141d2b] border border-[#223145] text-gray-300 flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
            {cooldownRemaining > 0 && (
              <a
                href={directScholarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-cyan-400 hover:underline shrink-0"
              >
                Open Scholar directly &rarr;
              </a>
            )}
          </div>
        )}
      </div>

      {/* Articles Stream */}
      <div className="p-3 space-y-3 flex-1 overflow-y-auto min-h-[220px]">
        {/* State 1: Displaying Scholar Results */}
        {scholarResults !== null ? (
          scholarResults.length > 0 ? (
            scholarResults.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-[#141d2b]/60 border border-[#1d293d] hover:border-cyan-500/40 transition-colors flex flex-col justify-between group space-y-2"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-white text-[11px] leading-snug group-hover:text-cyan-300 transition-colors">
                      {item.title}
                    </h3>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0 uppercase ${
                        item.source === "google_scholar"
                          ? "bg-blue-950/80 text-blue-300 border border-blue-800/60"
                          : "bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"
                      }`}
                    >
                      {item.source === "google_scholar" ? "Google Scholar" : "NCBI PMC"}
                    </span>
                  </div>
                  <p className="text-gray-400 text-[10px] mt-1 leading-relaxed line-clamp-2">
                    {item.snippet}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-[#1b2636]/60 text-[10px]">
                  <div className="flex items-center gap-2 text-gray-400 font-mono text-[9px] overflow-hidden truncate">
                    <span>{item.authors ? item.authors.split("-")[0].trim() : "Scholarly Article"}</span>
                    {item.year && <span className="text-gray-500">&bull; {item.year}</span>}
                    {item.citations !== undefined && item.citations !== null && (
                      <span className="text-amber-400 font-semibold">&bull; Cited by {item.citations}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.pdf_url && (
                      <a
                        href={item.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/50 text-[10px] font-medium transition-colors flex items-center gap-1"
                        title="Direct PDF download"
                      >
                        <Download className="w-2.5 h-2.5" />
                        <span>PDF</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setActiveArticle({
                          title: item.title,
                          authors: item.authors,
                          journal: item.journal || "Google Scholar Indexed Repository",
                          year: item.year || "2000+",
                          abstract: item.snippet,
                          url: item.url,
                          pdf_url: item.pdf_url,
                          source: item.source,
                        })
                      }
                      className="px-2 py-0.5 rounded bg-[#182332] hover:bg-cyan-600 hover:text-white text-cyan-400 border border-cyan-800/40 text-[10px] font-medium transition-colors"
                    >
                      [Read]
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded bg-[#182332] hover:bg-[#202e42] text-gray-400 hover:text-white transition-colors"
                      title="Open source article"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-gray-400 space-y-2">
              <BookOpen className="w-8 h-8 text-gray-500 mx-auto" />
              <p className="text-xs">No in-app Scholar results returned for &ldquo;{searchQuery}&rdquo;.</p>
              <a
                href={directScholarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 text-white font-medium text-xs hover:bg-cyan-500 transition-colors"
              >
                <span>Search Directly on Google Scholar</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )
        ) : (
          /* State 2: Default Curated Articles for the active case scan */
          articles.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-lg bg-[#141d2b]/60 border border-[#1d293d] hover:border-cyan-500/40 transition-colors flex flex-col justify-between group"
            >
              <div>
                <h3 className="font-semibold text-white text-[11px] leading-snug group-hover:text-cyan-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-[10px] mt-1 leading-relaxed line-clamp-2">
                  {item.excerpt}
                </p>
              </div>

              <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#1b2636]/60">
                <span className="text-[9px] text-cyan-400 font-mono">PMID: {item.pmid}</span>
                <button
                  type="button"
                  onClick={() =>
                    setActiveArticle({
                      title: item.title,
                      authors: item.authors,
                      journal: item.journal,
                      year: item.year,
                      abstract: item.abstract,
                      url: item.ncbiUrl,
                      pmid: item.pmid,
                      doi: item.doi,
                      source: "ncbi_pubmed",
                    })
                  }
                  className="px-2 py-0.5 rounded bg-[#182332] hover:bg-cyan-600 hover:text-white text-cyan-400 border border-cyan-800/40 text-[10px] font-medium transition-colors"
                >
                  [Read]
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Full Academic Paper Modal */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl bg-[#101722] border border-[#223145] rounded-xl shadow-2xl overflow-hidden text-gray-200 flex flex-col max-h-[88vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#141d2b] border-b border-[#1b2636]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  Academic Research Article & Abstract
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#1f2b3e] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-3.5 text-xs leading-relaxed">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  {activeArticle.journal} ({activeArticle.year})
                </span>
                <h2 className="text-sm font-bold text-white mt-1.5 leading-snug">
                  {activeArticle.title}
                </h2>
                <div className="text-[11px] text-gray-400 mt-1">
                  Authors: <span className="text-gray-300">{activeArticle.authors}</span>
                </div>
              </div>

              <div className="p-3 bg-[#0b1017] rounded-lg border border-[#1b2636] space-y-2">
                <div className="font-semibold text-white text-xs flex items-center gap-1.5 text-cyan-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  Clinical Abstract / Research Overview
                </div>
                <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-line">
                  {activeArticle.abstract}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-400 bg-[#141d2b]/60 p-2.5 rounded border border-[#1d293d]">
                {activeArticle.pmid && (
                  <div>PMID: <span className="text-white">{activeArticle.pmid}</span></div>
                )}
                {activeArticle.doi && (
                  <div>DOI: <span className="text-white">{activeArticle.doi}</span></div>
                )}
                <div>Source: <span className="text-cyan-400 uppercase">{activeArticle.source}</span></div>
                <div>Year: <span className="text-emerald-400">&ge; 2000</span></div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-[#0b1017] border-t border-[#1b2636] flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <a
                  href={activeArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  <span>View Publication</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                {activeArticle.pdf_url && (
                  <a
                    href={activeArticle.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download PDF</span>
                  </a>
                )}
              </div>

              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="px-4 py-1.5 bg-[#182332] hover:bg-[#223145] text-white rounded text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
