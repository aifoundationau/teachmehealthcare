"use client";

import React, { useState, useRef } from "react";
import {
  MedicalScanItem,
  SCAN_CATEGORIES,
  ALL_MODALITIES_DOCUMENT_LIST,
} from "@/lib/medicalData";
import {
  Search,
  Filter,
  ChevronRight,
  Activity,
  Layers,
  Check,
  X,
  UploadCloud,
} from "lucide-react";

interface RelatedScansPanelProps {
  scans: MedicalScanItem[];
  activeScanId: string;
  onSelectScan: (scan: MedicalScanItem) => void;
  onSelectDocumentModality?: (item: { name: string; category: string; modality: string }) => void;
  onUploadScan?: (newScan: MedicalScanItem) => void;
  onOpenUploadModal?: () => void;
}

export default function RelatedScansPanel({
  scans,
  activeScanId,
  onSelectScan,
  onSelectDocumentModality,
  onUploadScan,
  onOpenUploadModal,
}: RelatedScansPanelProps) {
  // Category filter for the Index dialog only; the scan list below is filtered by its search box.
  const [selectedCategory, setSelectedCategory] = useState<string>("All Modalities");
  const [searchQuery, setSearchQuery] = useState("");
  const [isBrowseModalOpen, setIsBrowseModalOpen] = useState(false);

  // Filter scans
  const filteredScans = scans.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.finding.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.modality.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="w-full h-full flex flex-col flex-1 bg-[#101722] rounded-xl border border-[#1b2636] shadow-md overflow-hidden text-xs">
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-[#141d2b] border-b border-[#1b2636] flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-semibold text-white tracking-wide uppercase text-[11px] sm:text-xs truncate">
            RELATED SCANS & DIAGNOSES
          </h2>
          <span className="text-[10px] text-gray-400 block truncate">
            Diagnostic Multimodal Cohort
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenUploadModal && (
            <button
              type="button"
              onClick={onOpenUploadModal}
              className="px-2 py-1 rounded bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-[10px] sm:text-xs font-semibold transition-all flex items-center gap-1 shadow-sm border border-cyan-400/30"
              title="Upload new clinical scan & description"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsBrowseModalOpen(true)}
            className="px-2.5 py-1 rounded bg-[#182332] hover:bg-cyan-600/30 text-cyan-400 hover:text-cyan-200 border border-cyan-800/50 text-[10px] sm:text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
            title="Browse all 100+ diagnostic scans in medical syllabus"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Index</span>
          </button>
        </div>
      </div>

      {/* Filter / Quick Search Bar */}
      <div className="p-2.5 bg-[#141d2b]/60 border-b border-[#1b2636] space-y-2">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter cohort scans..."
            className="w-full bg-[#0b1017] border border-[#223145] rounded-md py-1 pl-7 pr-2 text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Scans List Cards matching screenshot */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-0">
        {filteredScans.map((scan) => {
          const isActive = scan.id === activeScanId;
          return (
            <div
              key={scan.id}
              onClick={() => onSelectScan(scan)}
              className={`flex items-start gap-3 p-2 rounded-lg border transition-all cursor-pointer ${
                isActive
                  ? "bg-[#162234] border-cyan-500/80 shadow-md shadow-cyan-950/40"
                  : "bg-[#121a27] border-[#1e2a3d] hover:bg-[#152030] hover:border-gray-700"
              }`}
            >
              {/* Thumbnail Container */}
              <div className="relative w-14 h-14 rounded-md overflow-hidden bg-black border border-[#23334a] shrink-0 flex items-center justify-center">
                {scan.thumbnail ? (
                  <img
                    src={scan.thumbnail}
                    alt={scan.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <Activity className="w-6 h-6 text-gray-500" />
                )}
                {isActive && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400"></div>
                )}
              </div>

              {/* Scan Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h3
                    className={`font-semibold text-xs leading-snug truncate ${
                      isActive ? "text-cyan-300" : "text-white"
                    }`}
                  >
                    {scan.title}
                  </h3>
                </div>

                <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5 leading-tight">
                  {scan.finding}
                </p>

                <div className="mt-1.5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectScan(scan);
                    }}
                    className={`text-[11px] font-medium transition-colors flex items-center gap-1 ${
                      isActive
                        ? "text-cyan-400 font-semibold"
                        : "text-blue-400 hover:text-blue-300"
                    }`}
                  >
                    <span>View Scan</span>
                    <span className="text-[14px] leading-none text-cyan-400">•</span>
                  </button>

                  <span className="text-[9px] font-mono text-gray-500 uppercase">
                    {scan.modality}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredScans.length === 0 && (
          <div className="text-center py-6 text-gray-500 text-[11px]">
            No scans match your criteria.
          </div>
        )}
      </div>

      {/* Button to Open Document Modal */}
      <div className="p-2 bg-[#121a27] border-t border-[#1b2636]">
        <button
          type="button"
          onClick={() => setIsBrowseModalOpen(true)}
          className="w-full py-1.5 px-2 bg-[#172233] hover:bg-[#1e2e45] text-cyan-400 hover:text-cyan-300 rounded-md border border-cyan-900/60 font-medium text-[11px] flex items-center justify-center gap-1.5 transition-colors"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Browse All 100+ Diagnostic Modalities</span>
        </button>
      </div>



      {/* Syllabus Modality Document Index Modal */}
      {isBrowseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#101722] border border-[#22334a] rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-3.5 bg-[#141d2b] border-b border-[#22334a] flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white text-sm">
                  Complete Medical Diagnostic Modalities (100+ Syllabus Index)
                </h3>
                <span className="text-[10px] text-gray-400">
                  Document Reference: Plain Radiography, CT, MRI, Ultrasound, Nuclear Medicine, Endoscopy & Reports
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsBrowseModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded"
              >
                ✕
              </button>
            </div>

            {/* Filter by Category */}
            <div className="p-3 bg-[#121a27] border-b border-[#1f2d42] flex items-center gap-2 overflow-x-auto">
              <span className="text-[11px] text-gray-400 shrink-0 font-medium">Category:</span>
              {SCAN_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-[10px] whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? "bg-cyan-600 text-white font-semibold"
                      : "bg-[#182332] text-gray-300 hover:bg-[#202e42]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Modalities list */}
            <div className="p-4 overflow-y-auto space-y-2 max-h-[55vh]">
              {ALL_MODALITIES_DOCUMENT_LIST.filter((item) => {
                const matchCat =
                  selectedCategory === "All Modalities" || item.category === selectedCategory;
                return matchCat;
              }).map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (onSelectDocumentModality) {
                      onSelectDocumentModality(item);
                    }
                    setIsBrowseModalOpen(false);
                  }}
                  className="p-2.5 rounded-lg bg-[#141d2b]/70 border border-[#1d293d] hover:border-cyan-500/50 hover:bg-[#182332] cursor-pointer flex items-center justify-between transition-colors group"
                >
                  <div>
                    <span className="font-semibold text-white text-xs group-hover:text-cyan-300">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-gray-400 block">{item.category}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/40">
                    {item.modality}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
