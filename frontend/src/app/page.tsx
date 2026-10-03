"use client";

import React, { useState } from "react";
import {
  LucidePointer,
  ZoomIn,
  Move,
  Sun,
  Pencil,
  RotateCw,
  User,
  Bell,
  Send,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"conversation" | "annotations">("conversation");

  return (
    <div className="flex flex-col h-screen bg-[#0d131d] text-gray-200 font-sans select-none">
      {/* Top Navbar */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#121a24] border-b border-[#1e293b]">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-md text-white">
            <User className="w-5 h-5" />
          </div>
          <span className="font-semibold text-lg text-white">TeachMeHealth</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-[#1e293b]">
            <Bell className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white font-medium text-sm">
            D
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden p-3 gap-3">
        {/* Left Column: Image Viewer */}
        <div className="flex-1 flex flex-col bg-[#121a24] rounded-lg border border-[#1e293b] overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-1 p-2 bg-[#182230] border-b border-[#1e293b]">
            {[LucidePointer, ZoomIn, Move, Sun, Pencil, RotateCw].map((Icon, idx) => (
              <button
                key={idx}
                className={`p-2 rounded-md hover:bg-[#253346] text-gray-300 ${idx === 0 ? "bg-blue-600 text-white hover:bg-blue-500" : ""}`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {/* Main Image Stage */}
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
            {/* ID Tag */}
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm border border-gray-800 text-xs text-gray-300 p-2 rounded text-right">
              <div>ID: IMG_2026_09_03_A1</div>
              <div className="text-gray-400">3/09/2026 10:00 AM</div>
            </div>

            {/* Simulated X-Ray Visual */}
            <div className="relative w-80 h-96 bg-gradient-to-b from-gray-900 via-gray-700 to-gray-900 rounded-lg flex items-center justify-center border border-gray-800">
              <span className="text-gray-500 font-mono text-sm">[ X-Ray Image Preview ]</span>
              {/* Highlight Circle */}
              <div className="absolute w-16 h-16 border-2 border-red-500 rounded-full top-1/2 left-1/3 -translate-y-1/2 -translate-x-1/2 opacity-80 animate-pulse" />
            </div>
          </div>

          {/* Thumbnails Row */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#182230] border-t border-[#1e293b]">
            <button className="text-gray-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></button>
            <div className="flex gap-2">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-black border-2 border-blue-500 rounded overflow-hidden flex items-center justify-center text-[10px] text-gray-400">Lateral</div>
                <span className="text-[10px] text-gray-400 mt-1">Lateral View</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-black border border-gray-700 rounded overflow-hidden flex items-center justify-center text-[10px] text-gray-400">Post-Op</div>
                <span className="text-[10px] text-gray-400 mt-1">Post-Op</span>
              </div>
            </div>
            <button className="text-gray-400 hover:text-white"><ChevronRight className="w-5 h-5" /></button>
          </div>

          {/* Patient Details Bar */}
          <div className="grid grid-cols-4 gap-2 p-3 bg-[#121a24] border-t border-[#1e293b] text-xs">
            <div>
              <span className="text-gray-400 block">Patient ID</span>
              <span className="font-medium text-white">Anonymized</span>
            </div>
            <div>
              <span className="text-gray-400 block">Age</span>
              <span className="font-medium text-white">--</span>
            </div>
            <div>
              <span className="text-gray-400 block">Modality</span>
              <span className="font-medium text-white">X-ray</span>
            </div>
            <div>
              <span className="text-gray-400 block">Findings</span>
              <span className="font-medium text-white">Open Fracture Tibia/Fibula</span>
            </div>
          </div>
        </div>

        {/* Right Column: Chat & Discussion */}
        <div className="w-[420px] flex flex-col bg-[#121a24] rounded-lg border border-[#1e293b] overflow-hidden">
          <div className="p-3 border-b border-[#1e293b]">
            <h2 className="font-semibold text-white">Analysis & Collaboration</h2>
            <div className="flex border-b border-[#1e293b] mt-3">
              <button
                onClick={() => setActiveTab("conversation")}
                className={`pb-2 px-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "conversation" ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-gray-200"}`}
              >
                Conversation
              </button>
              <button
                onClick={() => setActiveTab("annotations")}
                className={`pb-2 px-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "annotations" ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-gray-200"}`}
              >
                Annotations
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
            <div className="bg-[#182230] p-3 rounded-lg border border-[#253346]">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-emerald-400">Dr. Emily Chen (Orthopedics):</span>
                <span className="text-gray-500 text-[10px]">10:15 AM</span>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Confirmed transverse fracture of the distal third of the tibia with significant fibula involvement. Recommending immediate reduction.
              </p>
            </div>

            <div className="bg-[#182230] p-3 rounded-lg border border-blue-900/50">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-blue-400">TeachMeHealth AI (Assistant):</span>
                <span className="text-gray-500 text-[10px]">10:16 AM</span>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Hello Dr. Chen. I see the fracture. Based on similar cases, typical management involves IM nailing. Would you like to review the preoperative surgical plan template?
              </p>
            </div>

            <div className="bg-[#182230] p-3 rounded-lg border border-[#253346]">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-purple-400">MedStudent Sarah:</span>
                <span className="text-gray-500 text-[10px]">10:20 AM</span>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Regarding the distal fragment placement, does the soft tissue injury alter the approach? What should I be looking for?
              </p>
            </div>
          </div>

          {/* Input Box */}
          <div className="p-3 bg-[#182230] border-t border-[#1e293b]">
            <div className="relative">
              <input
                type="text"
                placeholder="Ask TeachMeHealth about 'IMG_2026_09_03_A1'..."
                className="w-full bg-[#121a24] border border-[#253346] rounded-md py-2 pl-3 pr-9 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-400">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}