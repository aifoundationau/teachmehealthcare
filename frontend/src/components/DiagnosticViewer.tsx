"use client";

import React, { useState, useRef } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Sun,
  Contrast as ContrastIcon,
  Ruler,
  Eye,
  EyeOff,
  Maximize2,
  RefreshCw,
  Tag,
  Crosshair,
  Pencil
} from "lucide-react";
import { MedicalScanItem, Annotation } from "@/lib/medicalData";

interface DiagnosticViewerProps {
  scan: MedicalScanItem;
  onSelectRelatedScan?: (scanId: string) => void;
}

export default function DiagnosticViewer({ scan }: DiagnosticViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [isInverted, setIsInverted] = useState(false);
  const [contrastLevel, setContrastLevel] = useState(100);
  const [brightnessLevel, setBrightnessLevel] = useState(100);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [isRulerActive, setIsRulerActive] = useState(false);
  const [customRuler, setCustomRuler] = useState<{
    start: { x: number; y: number } | null;
    current: { x: number; y: number } | null;
    distanceMm: number | null;
  }>({ start: null, current: null, distanceMm: null });
  // True only while the mouse button is held down during a measurement.
  const [isMeasuring, setIsMeasuring] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);

  // Automatically reset to fill the middle box whenever active scan changes
  React.useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsRulerActive(false);
    setCustomRuler({ start: null, current: null, distanceMm: null });
  }, [scan.id, scan.image]);

  // Mouse wheel zoom. React's onWheel is passive, so preventDefault() there can't stop the
  // page from scrolling; a native non-passive listener can.
  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.min(Math.max(0.4, Number((prev + delta).toFixed(2))), 4.0));
    };
    stage.addEventListener("wheel", handleWheel, { passive: false });
    return () => stage.removeEventListener("wheel", handleWheel);
  }, []);

  // Pan / Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isRulerActive) {
      if (!stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * 100;
      const clickY = ((e.clientY - rect.top) / rect.height) * 100;
      setCustomRuler({
        start: { x: clickX, y: clickY },
        current: { x: clickX, y: clickY },
        distanceMm: 0,
      });
      setIsMeasuring(true);
      return;
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isRulerActive) {
      if (!isMeasuring || !customRuler.start || !stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      const currentX = ((e.clientX - rect.left) / rect.width) * 100;
      const currentY = ((e.clientY - rect.top) / rect.height) * 100;
      const dx = (currentX - customRuler.start.x) * 2.8; // scale calibration to mm
      const dy = (currentY - customRuler.start.y) * 2.8;
      const dist = Math.round(Math.sqrt(dx * dx + dy * dy));
      setCustomRuler((prev) => ({
        ...prev,
        current: { x: currentX, y: currentY },
        distanceMm: dist,
      }));
      return;
    }

    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsMeasuring(false);
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsInverted(false);
    setContrastLevel(100);
    setBrightnessLevel(100);
    setShowOverlay(true);
    setShowAnnotations(true);
    setIsRulerActive(false);
    setCustomRuler({ start: null, current: null, distanceMm: null });
  };

  // On-image label: the scan's primary finding, e.g. "Lower Lobe Opacity / Infiltration".
  const [labelMain, labelSub] = (scan.annotations[0]?.label ?? "").split(" / ");

  return (
    <div className="w-full h-full flex-1 flex flex-col bg-[#0b1017] rounded-xl border border-[#1b2636] shadow-xl overflow-hidden min-w-0">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#101722] border-b border-[#1b2636] text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white tracking-wide uppercase text-[11px] sm:text-xs">
            PATIENT CASE {scan.patientCase} - DIAGNOSTIC VIEWER
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800/60 text-blue-400 font-mono text-[10px]">
            {scan.modality}
          </span>
        </div>

        {/* Diagnostic Metadata Pill */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400 hidden md:inline">
            Patient: {scan.patientGender}, {scan.patientAge}y
          </span>
          <div className="px-2.5 py-0.5 rounded bg-[#182332] border border-[#223145] text-cyan-400 text-[11px] font-mono font-medium">
            {scan.badge}
          </div>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        ref={stageRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative flex-1 w-full h-full min-h-[460px] sm:min-h-[520px] bg-black overflow-hidden select-none flex items-center justify-center ${
          isRulerActive ? "cursor-crosshair" : isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {/* Modality Tag Overlay - Top Left */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none">
          <div className="px-2.5 py-1 rounded bg-black/60 backdrop-blur-md border border-gray-800 text-[11px] font-mono text-gray-200 tracking-wide">
            {scan.badge}
          </div>
        </div>

        {/* Patient & Acquisition Info - Top Right */}
        <div className="absolute top-3 right-3 z-20 pointer-events-none text-right">
          <div className="px-2.5 py-1.5 rounded bg-black/60 backdrop-blur-md border border-gray-800 text-[10px] font-mono text-gray-300 leading-tight">
            <div className="text-white font-medium">CASE: {scan.patientCase}</div>
            <div className="text-gray-400">{scan.bodyRegion}</div>
            <div className="text-cyan-400 font-semibold">{scan.finding}</div>
          </div>
        </div>

        {/* Scan Image Container with Transformations - Automatically fills the middle box */}
        <div
          className="relative w-full h-full transition-transform duration-75 ease-out flex items-center justify-center overflow-hidden"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            filter: `invert(${isInverted ? 1 : 0}) contrast(${contrastLevel}%) brightness(${brightnessLevel}%)`,
          }}
        >
          {/* Main Visual Image - Automatically fills the middle box */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={scan.image}
            alt={scan.title}
            className="w-full h-full object-cover pointer-events-none select-none shadow-2xl"
            draggable={false}
          />

          {/* Diagnostic Overlay Annotations */}
          {showOverlay && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {scan.annotations.map((ann) => {
                if (ann.type === "ellipse") {
                  return (
                    <g key={ann.id}>
                      {/* Dotted measurement ellipse matching screenshot */}
                      <ellipse
                        cx={ann.x}
                        cy={ann.y}
                        rx={(ann.width || 20) / 2}
                        ry={(ann.height || 18) / 2}
                        fill="rgba(56, 189, 248, 0.15)"
                        stroke="#38bdf8"
                        strokeWidth="0.6"
                        strokeDasharray="1.5 1"
                        className="animate-pulse"
                      />
                      {/* Crosshairs & measurement ticks */}
                      <line
                        x1={ann.x - (ann.width || 20) / 2}
                        y1={ann.y}
                        x2={ann.x + (ann.width || 20) / 2}
                        y2={ann.y}
                        stroke="#38bdf8"
                        strokeWidth="0.5"
                      />
                      <line
                        x1={ann.x}
                        y1={ann.y - (ann.height || 18) / 2}
                        x2={ann.x}
                        y2={ann.y + (ann.height || 18) / 2}
                        stroke="#38bdf8"
                        strokeWidth="0.5"
                      />
                      {/* End T-bars on calipers */}
                      <line
                        x1={ann.x - (ann.width || 20) / 2}
                        y1={ann.y - 1.5}
                        x2={ann.x - (ann.width || 20) / 2}
                        y2={ann.y + 1.5}
                        stroke="#38bdf8"
                        strokeWidth="0.6"
                      />
                      <line
                        x1={ann.x + (ann.width || 20) / 2}
                        y1={ann.y - 1.5}
                        x2={ann.x + (ann.width || 20) / 2}
                        y2={ann.y + 1.5}
                        stroke="#38bdf8"
                        strokeWidth="0.6"
                      />
                      <line
                        x1={ann.x - 1.5}
                        y1={ann.y - (ann.height || 18) / 2}
                        x2={ann.x + 1.5}
                        y2={ann.y - (ann.height || 18) / 2}
                        stroke="#38bdf8"
                        strokeWidth="0.6"
                      />
                      <line
                        x1={ann.x - 1.5}
                        y1={ann.y + (ann.height || 18) / 2}
                        x2={ann.x + 1.5}
                        y2={ann.y + (ann.height || 18) / 2}
                        stroke="#38bdf8"
                        strokeWidth="0.6"
                      />
                    </g>
                  );
                }

                if (ann.type === "arrow") {
                  return (
                    <g key={ann.id}>
                      <line
                        x1={ann.x - 6}
                        y1={ann.y + 4}
                        x2={ann.x + 2}
                        y2={ann.y - 2}
                        stroke="#38bdf8"
                        strokeWidth="0.7"
                        markerEnd="url(#arrowhead)"
                      />
                    </g>
                  );
                }
                return null;
              })}

              {/* Marker def for arrows */}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="4"
                  markerHeight="4"
                  refX="3"
                  refY="2"
                  orient="auto"
                >
                  <polygon points="0 0, 4 2, 0 4" fill="#38bdf8" />
                </marker>
              </defs>

              {/* Active Interactive Caliper / Ruler */}
              {isRulerActive && customRuler.start && customRuler.current && (
                <g>
                  <line
                    x1={customRuler.start.x}
                    y1={customRuler.start.y}
                    x2={customRuler.current.x}
                    y2={customRuler.current.y}
                    stroke="#10b981"
                    strokeWidth="0.7"
                    strokeDasharray="1 1"
                  />
                  <circle cx={customRuler.start.x} cy={customRuler.start.y} r="1" fill="#10b981" />
                  <circle cx={customRuler.current.x} cy={customRuler.current.y} r="1" fill="#10b981" />
                </g>
              )}
            </svg>
          )}

          {/* Diagnostic Label text overlay - matches screenshot text position */}
          {showAnnotations && labelMain && (
            <div className="absolute bottom-[8%] left-[36%] z-20 pointer-events-none">
              <div className="flex flex-col items-center">
                <span className="text-white text-xs sm:text-sm font-semibold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] bg-black/40 px-2.5 py-0.5 rounded backdrop-blur-xs">
                  {labelMain}
                </span>
                {labelSub && (
                  <span className="text-cyan-300 text-[11px] sm:text-xs font-medium tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    / {labelSub}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Active Measurement Tooltip */}
          {isRulerActive && customRuler.distanceMm && customRuler.current && (
            <div
              className="absolute z-30 px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-600 text-emerald-300 text-[11px] font-mono pointer-events-none shadow-lg -translate-x-1/2 -translate-y-8"
              style={{
                left: `${customRuler.current.x}%`,
                top: `${customRuler.current.y}%`,
              }}
            >
              {(customRuler.distanceMm / 10).toFixed(1)} cm ({customRuler.distanceMm} mm)
            </div>
          )}
        </div>

        {/* Viewport Scale Indicator - Bottom Right */}
        <div className="absolute bottom-3 right-3 z-20 pointer-events-none">
          <div className="px-2 py-1 rounded bg-black/60 backdrop-blur-md border border-gray-800 text-[10px] font-mono text-gray-400">
            Zoom: {Math.round(zoom * 100)}% | W/L: {contrastLevel}/{brightnessLevel}
          </div>
        </div>
      </div>

      {/* Bottom DICOM Controls Toolbar - Matches Mockup Exactly */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#101722] border-t border-[#1b2636] flex-wrap gap-2 text-xs">
        {/* Left Toolbar Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Zoom Control Button */}
          <div className="flex items-center gap-1 bg-[#182332] p-0.5 rounded border border-[#223145]">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(Number((z + 0.15).toFixed(2)), 4.0))}
              className="p-1.5 rounded hover:bg-[#25364d] text-gray-300 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5 text-cyan-400" />
            </button>
            <span className="text-[11px] font-mono px-1.5 text-gray-200 min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(Number((z - 0.15).toFixed(2)), 0.4))}
              className="p-1.5 rounded hover:bg-[#25364d] text-gray-300 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          </div>

          {/* Ruler / Measurement */}
          <button
            type="button"
            onClick={() => setIsRulerActive((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${
              isRulerActive
                ? "bg-emerald-600/30 text-emerald-300 border-emerald-500/50 shadow-sm"
                : "bg-[#182332] text-gray-300 hover:text-white border-[#223145] hover:bg-[#223145]"
            }`}
            title="Interactive Diagnostic Measurement Caliper"
          >
            <Pencil className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ruler/Measurement</span>
          </button>

          {/* Overlay Toggle */}
          <button
            type="button"
            onClick={() => setShowOverlay((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${
              showOverlay
                ? "bg-cyan-600/20 text-cyan-300 border-cyan-500/40"
                : "bg-[#182332] text-gray-400 border-[#223145] hover:text-gray-200"
            }`}
            title="Toggle Pathology Contours & Measurements"
          >
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span>Overlay</span>
          </button>

          {/* Contrast / Windowing */}
          <button
            type="button"
            onClick={() => {
              // Cycle through presets (Standard 100%, High Contrast 140%, Soft Tissue 120%)
              setContrastLevel((prev) => (prev === 100 ? 140 : prev === 140 ? 180 : 100));
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#182332] hover:bg-[#223145] text-gray-300 hover:text-white border border-[#223145] transition-colors"
            title="Cycle Window / Contrast Presets"
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Contrast</span>
          </button>

          {/* Invert Button (DICOM standard negative/positive grayscale) */}
          <button
            type="button"
            onClick={() => setIsInverted((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${
              isInverted
                ? "bg-amber-600/30 text-amber-300 border-amber-500/50"
                : "bg-[#182332] text-gray-300 hover:text-white border-[#223145] hover:bg-[#223145]"
            }`}
            title="Invert Grayscale (Bone White / Bone Black)"
          >
            <ContrastIcon className="w-3.5 h-3.5 text-gray-300" />
            <span>Invert</span>
          </button>

          {/* Annotations Toggle */}
          <button
            type="button"
            onClick={() => setShowAnnotations((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${
              showAnnotations
                ? "bg-blue-600/20 text-blue-300 border-blue-500/40"
                : "bg-[#182332] text-gray-400 border-[#223145] hover:text-gray-200"
            }`}
            title="Toggle Clinical Findings Labels"
          >
            <Tag className="w-3.5 h-3.5 text-blue-400" />
            <span>Annotations</span>
          </button>
        </div>

        {/* Right Actions: Reset */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#182332] hover:bg-[#223145] text-gray-300 hover:text-white border border-[#223145] text-xs font-medium transition-colors"
            title="Reset Pan, Zoom, and DICOM Adjustments"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
}
