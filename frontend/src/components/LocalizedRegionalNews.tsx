"use client";

import React, { useState } from "react";
import { Newspaper, X, ExternalLink, Calendar, ShieldAlert } from "lucide-react";
import { RegionalNewsArticle } from "@/lib/medicalData";

interface LocalizedRegionalNewsProps {
  articles: RegionalNewsArticle[];
  suburb: string;
  state: string;
}

export default function LocalizedRegionalNews({
  articles,
  suburb,
  state,
}: LocalizedRegionalNewsProps) {
  const [activeArticle, setActiveArticle] = useState<RegionalNewsArticle | null>(null);

  return (
    <div className="flex flex-col bg-[#101722] rounded-xl border border-[#1b2636] shadow-md overflow-hidden text-xs">
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-[#141d2b] border-b border-[#1b2636] flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-white tracking-wide uppercase text-[11px] sm:text-xs">
            LOCALIZED REGIONAL NEWS
          </h2>
          <div className="text-[10px] text-gray-400 mt-0.5">
            Regional Health Bulletins & Articles
          </div>
        </div>
        <Newspaper className="w-4 h-4 text-cyan-400/70" />
      </div>

      {/* Articles List */}
      <div className="p-3 space-y-3 flex-1 overflow-y-auto min-h-[180px]">
        {articles.map((item) => (
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
              <span className="text-[9px] text-gray-500 font-mono">{item.source}</span>
              <button
                type="button"
                onClick={() => setActiveArticle(item)}
                className="px-2 py-0.5 rounded bg-[#182332] hover:bg-cyan-600 hover:text-white text-cyan-400 border border-cyan-800/40 text-[10px] font-medium transition-colors"
              >
                [Read]
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Full Article Reader Modal */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-[#101722] border border-[#223145] rounded-xl shadow-2xl overflow-hidden text-gray-200 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#141d2b] border-b border-[#1b2636]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  Regional Medical Dispatch
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
            <div className="p-5 overflow-y-auto space-y-3 text-xs leading-relaxed">
              <h2 className="text-sm font-bold text-white leading-tight">
                {activeArticle.title}
              </h2>
              <div className="flex items-center gap-3 text-[10px] text-gray-400 pb-2 border-b border-[#1b2636]">
                <span className="px-1.5 py-0.5 rounded bg-[#182332] text-cyan-400 font-mono text-[9px] border border-cyan-800/40">
                  {activeArticle.region}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gray-500" />
                  {activeArticle.date}
                </span>
              </div>
              <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-line bg-[#0b1017] p-3.5 rounded-lg border border-[#1b2636]">
                {activeArticle.fullContent}
              </p>
              <div className="p-2.5 rounded bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 text-[11px]">
                <span className="font-semibold block mb-0.5">Clinical Relevance for Students:</span>
                Correlate clinical presentation with the patient diagnostic viewer. Community health alerts in this region indicate heightened probability of atypical mycoplasma and viral secondary pneumonias.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-2.5 bg-[#0b1017] border-t border-[#1b2636] flex justify-end">
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
