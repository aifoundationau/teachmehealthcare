"use client";

import React, { useState } from "react";
import { Send, MoreHorizontal, User, Sparkles, MessageSquare } from "lucide-react";
import { CaseroomMessage, MedicalScanItem } from "@/lib/medicalData";

interface CollaborativeCaseroomProps {
  scan: MedicalScanItem;
  currentUserName?: string;
}

export default function CollaborativeCaseroom({
  scan,
  currentUserName = "Alex Lee",
}: CollaborativeCaseroomProps) {
  const [messages, setMessages] = useState<CaseroomMessage[]>(scan.caseroom);
  const [inputValue, setInputValue] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);

  // When scan changes, update messages to the new scan's caseroom
  React.useEffect(() => {
    setMessages(scan.caseroom);
  }, [scan]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    const newMsg: CaseroomMessage = {
      id: `user-${Date.now()}`,
      senderName: currentUserName,
      role: "Student",
      avatarColor: "from-emerald-600 to-teal-600",
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      message: userText,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputValue("");
    setIsAiTyping(true);

    // Simulate Physician / Teacher pedagogical response
    setTimeout(() => {
      let replyMessage = "";
      let sender = "Dr. Sarah Jennings";
      let role: "Physician" | "Teacher" = "Physician";
      let avatarColor = "from-blue-600 to-cyan-600";

      const lower = userText.toLowerCase();
      if (lower.includes("antibiotic") || lower.includes("treatment") || lower.includes("amoxicillin") || lower.includes("penicillin")) {
        replyMessage = "Good consideration. For acute community-acquired lobar pneumonia in our regional guidelines, initial empiric coverage with ampicillin or amoxicillin plus a macrolide is standard.";
      } else if (lower.includes("ct") || lower.includes("effusion") || lower.includes("ultrasound") || lower.includes("drain")) {
        replyMessage = "Precisely! Notice how the ultrasound confirms the anechoic fluid pocket without thick septations, making simple thoracentesis feasible if symptoms persist.";
        sender = "Prof. Marcus Vance";
        role = "Teacher";
        avatarColor = "from-amber-600 to-orange-600";
      } else if (lower.includes("atelectasis") || lower.includes("volume") || lower.includes("collapse")) {
        replyMessage = "Notice there is no tracheal or mediastinal deviation toward the opacification, and air bronchograms are patent—distinguishing true alveolar consolidation from resorption atelectasis.";
      } else {
        replyMessage = `Very observant analysis, ${currentUserName}. Keep tracking the clinical symptoms alongside the radiographic consolidation margins.`;
        sender = "Prof. Marcus Vance";
        role = "Teacher";
        avatarColor = "from-amber-600 to-orange-600";
      }

      const aiReply: CaseroomMessage = {
        id: `reply-${Date.now()}`,
        senderName: sender,
        role: role,
        avatarColor: avatarColor,
        time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        message: replyMessage,
      };

      setMessages((prev) => [...prev, aiReply]);
      setIsAiTyping(false);
    }, 1200);
  };

  return (
    <div className="w-full h-full flex flex-col flex-1 bg-[#101722] rounded-xl border border-[#1b2636] shadow-md overflow-hidden text-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#141d2b] border-b border-[#1b2636]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="font-semibold text-white tracking-wide uppercase text-[11px] sm:text-xs">
            COLLABORATIVE CLASSROOM
          </h2>
        </div>
        <button className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#1f2b3e] transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Messages List - Exactly matching screenshot style */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.map((msg) => {
          const isPhysician = msg.role === "Physician";
          const isTeacher = msg.role === "Teacher";
          const isStudent = msg.role === "Student";

          return (
            <div key={msg.id} className="flex gap-2.5 items-start">
              {/* User Avatar */}
              <div
                className={`w-7 h-7 rounded-full bg-gradient-to-tr ${msg.avatarColor} flex items-center justify-center text-white font-bold text-[10px] shrink-0 shadow-sm border border-white/10`}
              >
                {msg.senderName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                  <span className="font-semibold text-white text-[11px]">{msg.senderName}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                      isPhysician
                        ? "bg-blue-950/80 text-blue-300 border border-blue-800/50"
                        : isTeacher
                        ? "bg-amber-950/80 text-amber-300 border border-amber-800/50"
                        : "bg-emerald-950/80 text-emerald-300 border border-emerald-800/50"
                    }`}
                  >
                    ({msg.role})
                  </span>
                  <span className="text-[10px] text-gray-500 ml-auto">{msg.time}</span>
                </div>
                <p className="text-gray-300 text-[11px] leading-relaxed bg-[#141d2b]/60 p-2 rounded-lg border border-[#1d293d]/50">
                  {msg.message}
                </p>
              </div>
            </div>
          );
        })}

        {isAiTyping && (
          <div className="flex items-center gap-2 text-gray-400 text-[10px] italic pl-9">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
            <span>Faculty response in progress...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="p-2.5 bg-[#141d2b] border-t border-[#1b2636]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message to the group..."
            className="flex-1 bg-[#0b1017] border border-[#223145] rounded-md px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#1f2b3e] hover:bg-cyan-600 text-gray-300 hover:text-white rounded-md text-xs font-medium border border-[#2d3e58] hover:border-cyan-500 transition-colors flex items-center gap-1 shadow-sm"
          >
            <span>Send</span>
          </button>
        </div>
      </form>
    </div>
  );
}
