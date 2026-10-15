"use client";

import React, { useState } from "react";
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  Heart
} from "lucide-react";
import {
  signInWithGooglePopup,
  linkSecondaryBackupPassword,
  signInWithSecondaryPassword,
  saveSupporterToFirestore,
  syncSupporterToBackend,
  UserProfile,
  APP_TAG
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
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [step, setStep] = useState<"google_prompt" | "details_form">("google_prompt");
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setStep("google_prompt");
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [initialMode, isOpen]);

  // Form Fields
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [comments, setComments] = useState("");

  // Login form fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Google Sign-In during registration - GMAIL REGISTER FIRST ALWAYS
  const handleGoogleRegisterStart = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await signInWithGooglePopup();
      setGoogleUser(user);
      setFullName(user.displayName || "TeachMeHealth Supporter");
      setEmail(user.email || "");
      setStep("details_form");
      setSuccessMsg(`Google account verified (${user.email})! Configure your optional backup password and details.`);
    } catch (err: any) {
      console.error("Google Auth error:", err);
      // Strictly enforce Google registration first - do NOT bypass to manual entry
      setErrorMsg(err.message || "Google sign-in is required to register as a supporter. Please sign in with your Gmail or Google Workspace account.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reusable core supporter registration function
  const executeSupporterRegistration = async (params: {
    finalName: string;
    finalEmail: string;
    finalPassword?: string;
    finalConfirmPassword?: string;
    finalPhone?: string;
    finalAddress?: string;
    finalComments?: string;
  }) => {
    setErrorMsg(null);
    const {
      finalName,
      finalEmail,
      finalPassword = "",
      finalConfirmPassword = "",
      finalPhone = "",
      finalAddress = "",
      finalComments = "",
    } = params;

    if (!finalEmail) {
      setErrorMsg("A verified Google / Gmail email address is required.");
      return;
    }
    if (finalPassword) {
      if (finalPassword.length < 6) {
        setErrorMsg("If setting a secondary backup password, it must be at least 6 characters.");
        return;
      }
      if (finalPassword !== finalConfirmPassword) {
        setErrorMsg("Passwords do not match.");
        return;
      }
    }
    if (!finalName) {
      setErrorMsg("Please provide your name.");
      return;
    }

    setIsLoading(true);
    try {
      const uid = googleUser?.uid || `user_${Date.now()}`;

      // 1. Link secondary password in Firebase Auth if Google user is active and password provided
      if (googleUser && finalPassword) {
        try {
          await linkSecondaryBackupPassword(finalPassword, finalEmail);
        } catch (linkErr: any) {
          console.warn("Firebase credential linking notice:", linkErr?.message);
        }
      }

      // 2. Store in Firestore with tag 'healthlms'
      await saveSupporterToFirestore(uid, {
        email: finalEmail,
        fullName: finalName,
        phoneNumber: finalPhone,
        address: finalAddress,
        comments: finalComments,
      });

      // 3. Store in database (SQLite / PostgreSQL backend) with 'healthlms' tag & role 'supporter'
      const backendResult = await syncSupporterToBackend({
        email: finalEmail,
        password: finalPassword, // stored as hashed backup password
        fullName: finalName,
        phoneNumber: finalPhone,
        address: finalAddress,
        comments: finalComments,
        role: "supporter",
        appTag: APP_TAG,
        firebaseUid: uid,
      });

      const profile: UserProfile = {
        id: backendResult.user?.id,
        firebaseUid: uid,
        email: finalEmail,
        fullName: finalName,
        role: "supporter",
        phoneNumber: finalPhone,
        address: finalAddress,
        comments: finalComments,
        appTag: APP_TAG,
        photoURL: googleUser?.photoURL || null,
        accessToken: backendResult.token,
      };

      setSuccessMsg("Welcome! You are now registered as a Teach Me Healthcare Supporter.");
      setTimeout(() => {
        onAuthSuccess(profile);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error("Registration error:", err);
      setErrorMsg(err.message || "Failed to complete supporter registration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Complete Supporter Registration via Form Submit
  const handleSupporterRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSupporterRegistration({
      finalName: fullName,
      finalEmail: email,
      finalPassword: password,
      finalConfirmPassword: confirmPassword,
      finalPhone: phoneNumber,
      finalAddress: address,
      finalComments: comments,
    });
  };

  // Quick Register with verified Google profile only
  const handleQuickRegisterWithGoogle = async () => {
    await executeSupporterRegistration({
      finalName: fullName || googleUser?.displayName || "TeachMeHealth Supporter",
      finalEmail: email || googleUser?.email || "",
      finalPassword: "",
      finalConfirmPassword: "",
      finalPhone: phoneNumber,
      finalAddress: address,
      finalComments: comments,
    });
  };

  // Handle Login with Google
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await signInWithGooglePopup();
      // Sync or fetch from backend
      try {
        const backendResult = await syncSupporterToBackend({
          email: user.email || "",
          password: "", // existing account
          fullName: user.displayName || "Supporter",
          role: "supporter",
          appTag: APP_TAG,
          firebaseUid: user.uid,
        });

        const profile: UserProfile = {
          id: backendResult.user?.id,
          firebaseUid: user.uid,
          email: user.email || "",
          fullName: backendResult.user?.full_name || user.displayName || "Supporter",
          role: backendResult.user?.role || "supporter",
          phoneNumber: backendResult.user?.phone_number,
          address: backendResult.user?.address,
          comments: backendResult.user?.supporter_comments,
          appTag: APP_TAG,
          photoURL: user.photoURL,
          accessToken: backendResult.token,
        };

        setSuccessMsg("Signed in successfully via Google!");
        setTimeout(() => {
          onAuthSuccess(profile);
          onClose();
        }, 800);
      } catch (beErr) {
        // Fallback profile if backend sync is partial
        const profile: UserProfile = {
          firebaseUid: user.uid,
          email: user.email || "",
          fullName: user.displayName || "Supporter",
          role: "supporter",
          appTag: APP_TAG,
          photoURL: user.photoURL,
        };
        onAuthSuccess(profile);
        onClose();
      }
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setErrorMsg(err.message || "Google sign in failed. Please try again or use your secondary password.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Login with Secondary Password Backup
  const handleSecondaryPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      // First try backend database login
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api";
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("tmh_token", data.access_token);
        localStorage.setItem("tmh_user", JSON.stringify(data.user));

        const profile: UserProfile = {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.full_name,
          role: data.user.role || "supporter",
          phoneNumber: data.user.phone_number,
          address: data.user.address,
          comments: data.user.supporter_comments,
          appTag: data.user.app_tag || APP_TAG,
          accessToken: data.access_token,
        };

        setSuccessMsg("Logged in with secondary password backup!");
        setTimeout(() => {
          onAuthSuccess(profile);
          onClose();
        }, 800);
        return;
      }

      // If backend failed, try Firebase Auth directly
      try {
        const user = await signInWithSecondaryPassword(loginEmail, loginPassword);
        const profile: UserProfile = {
          firebaseUid: user.uid,
          email: user.email || loginEmail,
          fullName: user.displayName || "Supporter",
          role: "supporter",
          appTag: APP_TAG,
        };
        setSuccessMsg("Logged in successfully via Firebase backup!");
        setTimeout(() => {
          onAuthSuccess(profile);
          onClose();
        }, 800);
      } catch (fbErr: any) {
        throw new Error("Invalid email or secondary password.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Login failed. Check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#121a24] border border-[#253346] rounded-xl shadow-2xl overflow-hidden text-gray-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#182230]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-wide">
                TeachMeHealth LMS
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-gray-400">Application Tag:</span>
                <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                  {APP_TAG}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#253346] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-[#0d131d] border-b border-[#1e293b] text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setErrorMsg(null);
            }}
            className={`py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              mode === "register"
                ? supportPrompt
                  ? "bg-rose-950/70 text-rose-300 shadow-sm border border-rose-500/40 font-semibold"
                  : "bg-[#1f2d40] text-blue-400 shadow-sm border border-blue-500/20 font-semibold"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {supportPrompt ? (
              <Heart className="w-3.5 h-3.5 fill-rose-500/40 text-rose-400" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{supportPrompt ? "Register Supporter (Required)" : "Register as Supporter"}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMsg(null);
            }}
            className={`py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              mode === "login"
                ? "bg-[#1f2d40] text-blue-400 shadow-sm border border-blue-500/20 font-semibold"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{supportPrompt ? "Supporter Log In" : "Log In"}</span>
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-950/60 border border-red-800/60 rounded-lg text-xs text-red-300 flex items-start gap-2 animate-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-lg text-xs text-emerald-300 flex items-start gap-2 animate-in slide-in-from-top-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {supportPrompt && mode === "register" && (
            <div className="p-3.5 rounded-lg bg-gradient-to-r from-rose-950/90 via-pink-950/70 to-[#182230] border border-rose-500/60 text-xs shadow-md flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/40 shadow-inner">
                <Heart className="w-4 h-4 fill-rose-500/70" />
              </div>
              <div className="text-left">
                <div className="font-bold text-white text-[12px]">Support Teach Me Healthcare</div>
                <div className="text-[11px] text-rose-200/90 leading-tight mt-0.5">
                  Guests must register with Google / Gmail first to become a Supporter. The Support Teach Me Healthcare payment gateway will open once registered.
                </div>
              </div>
            </div>
          )}
          {mode === "register" ? (
            /* ================= REGISTER AS SUPPORTER FLOW ================= */
            <div>
              {step === "google_prompt" ? (
                <div className="space-y-4 text-center py-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 text-[11px] font-semibold tracking-wider uppercase shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>GMAIL REGISTER FIRST ALWAYS</span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white tracking-wide">
                      Step 1: Register with Google / Gmail
                    </h3>
                    <p className="text-xs text-gray-300 max-w-md mx-auto leading-relaxed">
                      All supporters must first authenticate with their Google account (Gmail / Google Workspace). This confirms your identity, activates your <span className="text-emerald-400 font-semibold">Supporter</span> role, and opens the payment gateway.
                    </p>
                  </div>

                  <div className="p-3 bg-[#182230] border border-[#253346] rounded-lg text-left text-xs space-y-2">
                    <div className="flex items-center gap-2 text-gray-200 font-medium border-b border-[#253346] pb-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Registration Architecture & Scope:</span>
                    </div>
                    <ul className="text-gray-400 text-[11px] space-y-1.5 pl-1">
                      <li className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">&bull;</span>
                        <span><strong>1. Primary Identity:</strong> Authenticate with Gmail/Google Workspace to become an active Supporter (tag: <code className="text-cyan-300 font-mono">{APP_TAG}</code>).</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-blue-400 font-bold">&bull;</span>
                        <span><strong>2. Optional Backup:</strong> Configure a secondary login password stored in the database if Google is ever unavailable.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-rose-400 font-bold">&bull;</span>
                        <span><strong>3. Payment Gateway:</strong> Direct access to the Support Teach Me Healthcare Stripe gateway immediately once registered.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Google OAuth Button - Mandatory First Step */}
                  <div className="pt-1 space-y-2">
                    <button
                      type="button"
                      onClick={handleGoogleRegisterStart}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-lg shadow-lg hover:shadow-cyan-500/20 transition-all duration-150 text-xs disabled:opacity-50 border border-gray-200"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                      <span>
                        {isLoading ? "Connecting to Google OAuth..." : "Register First with Google / Gmail (Required)"}
                      </span>
                    </button>
                    <p className="text-[11px] text-gray-400">
                      Mandatory first step: Google OAuth establishes your verified Supporter profile.
                    </p>
                  </div>
                </div>
              ) : (
                /* STEP 2: Secondary Password & Personal Details Form */
                <form onSubmit={handleSupporterRegisterSubmit} className="space-y-3.5">
                  <div className="flex items-center justify-between pb-1 border-b border-[#1e293b]">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">2</span>
                      <span className="text-xs font-semibold text-white">Supporter Details & Secondary Password</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 font-medium">
                      Role: Supporter
                    </span>
                  </div>

                  {/* Verified Google Account Banner */}
                  <div className="p-3 bg-emerald-950/60 border border-emerald-600/50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        ✓
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white block">
                          Verified Google Account: {email}
                        </span>
                        <span className="text-[10px] text-emerald-300">
                          Supporter status ready &bull; Tag: <strong className="font-mono text-cyan-300">{APP_TAG}</strong>
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-200 border border-emerald-700 font-semibold hidden sm:inline-block">
                      ACTIVE SUPPORTER
                    </span>
                  </div>

                  {/* Quick Register Action for instant access */}
                  <div className="p-3 bg-[#182230] border border-[#253346] rounded-lg flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-semibold text-white block">Fast Supporter Activation</span>
                      <span className="text-[11px] text-gray-400">
                        Continue directly with Google profile to open payment gateway, or fill optional fields below.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleQuickRegisterWithGoogle}
                      disabled={isLoading}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg text-xs transition-all shrink-0 shadow flex items-center gap-1 disabled:opacity-50"
                    >
                      <span>Instant Register</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Secondary Password Alert Note */}
                  <div className="p-2.5 bg-blue-950/40 border border-blue-800/40 rounded-lg text-[11px] text-blue-200 flex items-start gap-2">
                    <KeyRound className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Secondary Password Backup (Optional):</strong> Stored securely in database to guarantee access if Google OAuth is ever unavailable.
                    </span>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-300 mb-1">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Dr. Jane Doe / Alex Smith"
                        className="w-full bg-[#182230] border border-[#253346] rounded-md py-1.5 pl-8 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Verified Primary Email (Locked to Google Account) */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-300 mb-1 flex items-center justify-between">
                      <span>Primary Email (Gmail / Workspace)</span>
                      <span className="text-emerald-400 text-[10px] font-medium">✓ Verified via Google</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        readOnly
                        value={email}
                        className="w-full bg-[#141b26] border border-[#202c3d] rounded-md py-1.5 pl-8 pr-3 text-xs text-gray-300 cursor-not-allowed select-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Secondary Password & Confirm (Optional) */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-300 mb-1">
                        Secondary Password <span className="text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 6 characters (optional)"
                          className="w-full bg-[#182230] border border-[#253346] rounded-md py-1.5 pl-7 pr-7 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-300 mb-1">
                        Confirm Password <span className="text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm if set"
                          className="w-full bg-[#182230] border border-[#253346] rounded-md py-1.5 pl-7 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-300 mb-1">
                      Phone Number <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+61 400 123 456"
                        className="w-full bg-[#182230] border border-[#253346] rounded-md py-1.5 pl-8 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-300 mb-1">
                      Address <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Street, City, State, Postcode"
                        className="w-full bg-[#182230] border border-[#253346] rounded-md py-1.5 pl-8 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Comment Box */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-300 mb-1">
                      Other Details / Comments <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <textarea
                        rows={2}
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Any additional details or message you wish to share with TeachMeHealth..."
                        className="w-full bg-[#182230] border border-[#253346] rounded-md py-1.5 px-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStep("google_prompt")}
                      className="px-3 py-2 bg-[#182230] hover:bg-[#253346] text-gray-300 rounded-md text-xs font-medium"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-md shadow-md text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isLoading ? "Activating Supporter Status..." : "Complete Registration & Open Payment Gateway"}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* ================= LOGIN FLOW ================= */
            <div className="space-y-4 py-2">
              <div className="space-y-1 text-center">
                <h3 className="text-base font-semibold text-white">Welcome Back</h3>
                <p className="text-xs text-gray-400">
                  Log in with Google or use your secondary backup password.
                </p>
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-gray-100 text-gray-800 font-semibold rounded-lg shadow transition-all duration-150 text-xs disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>{isLoading ? "Signing in..." : "Continue with Google"}</span>
              </button>

              <div className="relative my-4 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#1e293b]" />
                </div>
                <span className="relative bg-[#121a24] px-2 text-[11px] text-gray-500 uppercase tracking-wider">
                  or secondary password backup
                </span>
              </div>

              {/* Email & Secondary Password Form */}
              <form onSubmit={handleSecondaryPasswordLogin} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="supporter@example.com"
                      className="w-full bg-[#182230] border border-[#253346] rounded-md py-1.5 pl-8 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-300 mb-1">
                    Secondary Backup Password
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Your secondary login password"
                      className="w-full bg-[#182230] border border-[#253346] rounded-md py-1.5 pl-8 pr-8 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Use this login method if Google fails or if you prefer password access.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-md shadow-md text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
                >
                  {isLoading ? "Authenticating..." : "Log In with Backup Password"}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-2.5 bg-[#0d131d] border-t border-[#1e293b] flex items-center justify-between text-[11px] text-gray-500">
          <span>Tagged: <code className="text-gray-400 font-mono">{APP_TAG}</code></span>
          <span>Google OAuth 2.0 &bull; Firebase Auth</span>
        </div>
      </div>
    </div>
  );
}
