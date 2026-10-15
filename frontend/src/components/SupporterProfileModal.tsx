"use client";

import React, { useState } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Heart,
  CreditCard,
  LogOut,
  Edit2,
  Check,
  KeyRound,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { UserProfile, logOutUser, APP_TAG } from "@/lib/firebase";

interface SupporterProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUserUpdate: (updatedUser: UserProfile) => void;
  onLogOut: () => void;
  focusPayment?: boolean;
}

export default function SupporterProfileModal({
  isOpen,
  onClose,
  user,
  onUserUpdate,
  onLogOut,
  focusPayment = true,
}: SupporterProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"payment" | "details">("payment");
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user.fullName || "");
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || "");
  const [address, setAddress] = useState(user.address || "");
  const [comments, setComments] = useState(user.comments || "");
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(focusPayment ? "payment" : "details");
      setIsEditing(false);
    }
  }, [isOpen, focusPayment]);

  // Stripe contribution state
  const [selectedAmount, setSelectedAmount] = useState<number>(25);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isStripeLoading, setIsStripeLoading] = useState(false);
  const [stripeMessage, setStripeMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveDetails = async () => {
    setIsSaving(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api";
      const token = localStorage.getItem("tmh_token");

      if (token) {
        await fetch(`${baseUrl}/auth/me`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            full_name: fullName,
            phone_number: phoneNumber,
            address: address,
            comments: comments,
          }),
        });
      }

      const updated = {
        ...user,
        fullName,
        phoneNumber,
        address,
        comments,
      };
      onUserUpdate(updated);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStripeContribution = async () => {
    setIsStripeLoading(true);
    setStripeMessage(null);
    try {
      const amount = customAmount ? parseFloat(customAmount) : selectedAmount;
      const amountCents = Math.round(amount * 100);

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api";
      const token = localStorage.getItem("tmh_token");

      const response = await fetch(`${baseUrl}/supporter/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          amount_cents: amountCents,
          currency: "aud",
          supporter_name: user.fullName,
          supporter_email: user.email,
          comments: `TeachMeHealth LMS Supporter contribution by ${user.fullName}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to create Stripe checkout session");
      }

      const data = await response.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setStripeMessage("Payment session created successfully (Test Mode).");
      }
    } catch (err: any) {
      setStripeMessage(err.message || "Failed to initiate Stripe contribution.");
    } finally {
      setIsStripeLoading(false);
    }
  };

  const handleLogout = async () => {
    await logOutUser();
    onLogOut();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#121a24] border border-[#253346] rounded-xl shadow-2xl overflow-hidden text-gray-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#182230]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow">
              {user.fullName ? user.fullName[0].toUpperCase() : "S"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">{user.fullName || "Supporter"}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 font-medium flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                  {user.role ? user.role.toUpperCase() : "SUPPORTER"}
                </span>
              </div>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#253346] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-[#0d131d] border-b border-[#1e293b] text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("payment")}
            className={`py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "payment"
                ? "bg-rose-950/70 text-rose-300 shadow-sm border border-rose-500/40 font-semibold"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-rose-500/40 text-rose-400" />
            Support Payment Gateway
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "details"
                ? "bg-[#1f2d40] text-blue-400 shadow-sm border border-blue-500/20 font-semibold"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <User className="w-3.5 h-3.5 text-blue-400" />
            Supporter Details & Scope
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs">
          {activeTab === "payment" ? (
            /* ================= SUPPORT TEACH ME HEALTHCARE PAYMENT GATEWAY ================= */
            <div className="space-y-4">
              {/* Active Supporter Status Card */}
              <div className="p-3 bg-gradient-to-r from-emerald-950/60 to-blue-950/40 border border-emerald-600/40 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-white text-xs block">
                      Registered Supporter: {user.fullName}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {user.email} &bull; Tag: <strong className="text-cyan-400 font-mono">{APP_TAG}</strong>
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 text-[10px] font-semibold">
                  ACTIVE SUPPORTER
                </span>
              </div>

              {/* Stripe Supporter Payment Gateway Box */}
              <div className="p-5 bg-gradient-to-br from-[#182230] to-[#1a233a] border border-[#253346] rounded-xl space-y-4 shadow-lg ring-1 ring-rose-500/30">
                <div className="flex items-center justify-between border-b border-[#253346] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shadow-inner">
                      <Heart className="w-5 h-5 fill-rose-500/50" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Support Teach Me Healthcare</h4>
                      <p className="text-[11px] text-rose-300/80">
                        Official Supporter Payment Gateway &bull; Powered by Stripe
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/40 border border-[#253346] text-cyan-400">
                    AUD $
                  </span>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  Your contribution directly funds open medical imaging educational servers, AI diagnostic simulators, and learning bandwidth for healthcare students in remote and regional communities.
                </p>

                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[10, 25, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amt);
                        setCustomAmount("");
                      }}
                      className={`py-2 rounded-lg font-bold text-xs border transition-all ${
                        selectedAmount === amt && !customAmount
                          ? "bg-rose-600 text-white border-rose-500 shadow-md scale-[1.02]"
                          : "bg-[#121a24] text-gray-300 border-[#253346] hover:border-gray-400"
                      }`}
                    >
                      ${amt} AUD
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    placeholder="Custom Amount ($ AUD)"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="flex-1 bg-[#121a24] border border-[#253346] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={handleStripeContribution}
                    disabled={isStripeLoading}
                    className="py-2 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    <CreditCard className="w-4 h-4" />
                    {isStripeLoading ? "Redirecting to Stripe..." : `Contribute $${customAmount || selectedAmount} AUD`}
                  </button>
                </div>

                {stripeMessage && (
                  <p className="text-[11px] text-amber-300 bg-amber-950/40 p-2.5 rounded border border-amber-800/40">
                    {stripeMessage}
                  </p>
                )}

                <div className="pt-2 border-t border-[#253346]/60 flex items-center justify-between text-[10px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    PCI DSS Level 1 Certified &bull; Encrypted Stripe Session
                  </span>
                  <span>100% Tax Deductible Supporter Receipt</span>
                </div>
              </div>
            </div>
          ) : (
            /* ================= REGISTERED PERSONAL DETAILS & ACCOUNT TAB ================= */
            <div className="space-y-4">
              {/* Tag & Security Badges */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#182230] border border-[#253346] rounded-lg">
                  <span className="text-[10px] text-gray-400 block mb-0.5">Application Scope</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    <span className="font-mono text-xs font-semibold text-blue-300">
                      {APP_TAG}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-[#182230] border border-[#253346] rounded-lg">
                  <span className="text-[10px] text-gray-400 block mb-0.5">Authentication Security</span>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Google + Password Backup</span>
                  </div>
                </div>
              </div>

              {/* Personal Details Section */}
              <div className="p-4 bg-[#182230] border border-[#253346] rounded-lg space-y-3">
                <div className="flex items-center justify-between border-b border-[#253346] pb-2">
                  <h3 className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    Registered Personal Details
                  </h3>
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSaveDetails}
                      disabled={isSaving}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                    >
                      <Check className="w-3 h-3" /> {isSaving ? "Saving..." : "Save"}
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-[#121a24] border border-[#253346] rounded px-2.5 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+61 400 000 000"
                        className="w-full bg-[#121a24] border border-[#253346] rounded px-2.5 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Address</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Street, Suburb, Postcode"
                        className="w-full bg-[#121a24] border border-[#253346] rounded px-2.5 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Comments & Notes</label>
                      <textarea
                        rows={2}
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Any medical topics or notes you wish to share..."
                        className="w-full bg-[#121a24] border border-[#253346] rounded px-2.5 py-1 text-xs text-white resize-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-gray-400">Phone:</span>
                      <span className="text-gray-200">{phoneNumber || "Not provided"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-gray-400">Address:</span>
                      <span className="text-gray-200">{address || "Not provided"}</span>
                    </div>
                    <div className="flex items-start gap-2 pt-1 border-t border-[#253346]/60">
                      <MessageSquare className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-gray-400 block">Comments / Shared Details:</span>
                        <span className="text-gray-300 italic">
                          {comments || "No comments shared yet."}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#0d131d] border-t border-[#1e293b] flex items-center justify-between">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
          <span className="text-[11px] text-gray-500 font-mono">
            TeachMeHealth LMS &bull; Tag: {APP_TAG}
          </span>
        </div>
      </div>
    </div>
  );
}
