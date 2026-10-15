"use client";

import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Heart,
  ExternalLink,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  signInWithGooglePopup,
  saveSupporterToFirestore,
  syncSupporterToBackend,
  UserProfile,
  APP_TAG,
} from "@/lib/firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
  initialMode?: "login" | "register";
  supportPrompt?: boolean;
}

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = "register",
  supportPrompt = false,
}: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const user = await signInWithGooglePopup();

      let profile: UserProfile;
      try {
        const backendResult = await syncSupporterToBackend({
          email: user.email || "",
          password: "",
          fullName: user.displayName || "Supporter User",
          role: "supporter",
          appTag: APP_TAG,
          firebaseUid: user.uid,
        });

        profile = {
          id: backendResult.id,
          firebaseUid: user.uid,
          email: user.email || "",
          fullName: backendResult.fullName || user.displayName || "Supporter User",
          role: backendResult.role || "supporter",
          phoneNumber: backendResult.phoneNumber,
          address: backendResult.address,
          comments: backendResult.comments,
          appTag: APP_TAG,
          photoURL: user.photoURL,
          accessToken: backendResult.accessToken,
        };
      } catch {
        profile = {
          firebaseUid: user.uid,
          email: user.email || "",
          fullName: user.displayName || "Supporter User",
          role: "supporter",
          appTag: APP_TAG,
          photoURL: user.photoURL,
        };
      }

      // Save to Firestore with app_tag: healthlms
      saveSupporterToFirestore(user.uid, {
        email: user.email,
        fullName: user.displayName,
        role: "supporter",
        appTag: APP_TAG,
      });

      setSuccessMsg(`Welcome, ${user.displayName || user.email}!`);
      setTimeout(() => {
        onAuthSuccess(profile);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setErrorMsg(err.message || "Failed to sign in with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#121a24] border border-[#253346] rounded-2xl shadow-2xl overflow-hidden text-gray-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#182230]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                TeachMeHealth LMS
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-gray-400">Application Tag:</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold">
                  {APP_TAG}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#253346] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-center">
          {supportPrompt && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-950/80 via-pink-950/60 to-[#182230] border border-rose-500/50 text-xs shadow-md flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/40 shadow-inner">
                <Heart className="w-4 h-4 fill-rose-500/70" />
              </div>
              <div>
                <div className="font-bold text-white text-[12px]">Support Teach Me Healthcare</div>
                <div className="text-[11px] text-rose-200/90 leading-tight mt-0.5">
                  Sign in with your Google account to register as an active Supporter. The support payment gateway will open immediately.
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-700/60 text-cyan-300 text-[11px] font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Google Authentication</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              {supportPrompt
                ? "Register with Google"
                : initialMode === "register"
                ? "Register with Google"
                : "Sign In with Google"}
            </h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
              Authenticate securely with your Google or Gmail account to access diagnostic scans, clinical caserooms, and supporter features.
            </p>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-start gap-2.5 text-left animate-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5 text-left animate-in slide-in-from-top-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{successMsg}</span>
            </div>
          )}

          {/* Primary Google Login Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-5 bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-900 font-bold rounded-xl shadow-lg hover:shadow-cyan-500/20 transition-all duration-150 text-sm disabled:opacity-60 border border-gray-200 group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                  <ArrowRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform ml-auto" />
                </>
              )}
            </button>
          </div>

          <div className="pt-1 text-[11px] text-gray-500 leading-relaxed">
            Instant authentication via Google OAuth 2.0. No password required.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#0d131d] border-t border-[#1e293b] flex items-center justify-between text-[11px] text-gray-500">
          <span>Tagged: <code className="text-gray-400 font-mono">{APP_TAG}</code></span>
          <span className="flex items-center gap-1 text-cyan-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> Google OAuth 2.0
          </span>
        </div>
      </div>
    </div>
  );
}
