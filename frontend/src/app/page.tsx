"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Search,
  User,
  Bell,
  Sparkles,
  Heart,
  LogIn,
  MapPin,
  Sliders,
  ExternalLink,
  Layers,
  MessageSquare,
  Newspaper,
  BookOpen,
  Image as ImageIcon,
  UploadCloud,
} from "lucide-react";
import AuthModal from "@/components/AuthModal";
import SupporterProfileModal from "@/components/SupporterProfileModal";
import GeolocationModal from "@/components/GeolocationModal";
import DiagnosticViewer from "@/components/DiagnosticViewer";
import CollaborativeCaseroom from "@/components/CollaborativeCaseroom";
import LocalizedRegionalNews from "@/components/LocalizedRegionalNews";
import AcademicResearch from "@/components/AcademicResearch";
import RelatedScansPanel from "@/components/RelatedScansPanel";
import UploadScanModal from "@/components/UploadScanModal";
import { apiFetch } from "@/lib/api";

import {
  UserProfile,
  APP_TAG,
  auth,
  logOutUser,
  onAuthStateChanged,
  signInWithGooglePopup,
  syncSupporterToBackend,
  saveSupporterToFirestore,
} from "@/lib/firebase";
import {
  GeoSettings,
  DEFAULT_GEO_SETTINGS,
  getStoredGeoSettings,
  hasStoredGeoSettings,
  formatDateTime,
} from "@/lib/geoSettings";
import { readStorage, writeStorage } from "@/lib/storage";
import {
  MedicalScanItem,
  INITIAL_MEDICAL_SCANS,
  ALL_MODALITIES_DOCUMENT_LIST,
} from "@/lib/medicalData";

// Location shown until the user saves their own: Parkwood, QLD (Queensland has no daylight saving).
const DEFAULT_LOCATION: GeoSettings = {
  ...DEFAULT_GEO_SETTINGS,
  suburb: "Parkwood",
  state: "QLD",
  postcode: "4214",
  timezone: "Australia/Brisbane",
  latitude: -27.9547,
  longitude: 153.3773,
};

export default function Home() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("register");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSupportPrompt, setIsSupportPrompt] = useState(false);
  const [profileFocusPayment, setProfileFocusPayment] = useState(true);

  // Geolocation & regional settings state
  const [geoSettings, setGeoSettings] = useState<GeoSettings>(DEFAULT_LOCATION);
  const [isGeoModalOpen, setIsGeoModalOpen] = useState(false);
  // Set after mount: a time rendered on the server would never match the browser's clock.
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Active scan & diagnostics state
  const [activeScan, setActiveScan] = useState<MedicalScanItem>(INITIAL_MEDICAL_SCANS[0]);
  const [cohortScans, setCohortScans] = useState<MedicalScanItem[]>(INITIAL_MEDICAL_SCANS);
  const [searchCondition, setSearchCondition] = useState("");
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  // Universal Responsive active tab for small/mobile devices (< 768px)
  const [mobileTab, setMobileTab] = useState<"viewer" | "scans" | "caseroom" | "news" | "academic">(
    "viewer"
  );
  const [isScansDrawerOpen, setIsScansDrawerOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Load community uploaded scans from server & local storage so they are always available
  useEffect(() => {
    async function loadCommunityScans() {
      try {
        const cached = readStorage("tmh_uploaded_scans");
        let cachedScans: MedicalScanItem[] = [];
        if (cached) {
          try {
            cachedScans = JSON.parse(cached);
          } catch (e) {}
        }

        const res = await apiFetch("/images?limit=50");
        if (res.ok) {
          const dbImages = await res.json();
          const fetchedScans: MedicalScanItem[] = dbImages.map((img: any) => {
            const rawMod = (img.modality || "").toLowerCase();
            const displayModality =
              rawMod === "ct" ? "CT" : rawMod === "mri" ? "MRI" : rawMod === "ultrasound" ? "Ultrasound" : "X-Ray";
            return {
              id: `scan-db-${img.id}`,
              category: `${displayModality} Imaging`,
              title: img.title,
              modality: displayModality as any,
              patientCase: `${img.body_region || "Clinical"} Case #${img.id}`,
              finding: img.description
                ? img.description.slice(0, 110) + (img.description.length > 110 ? "..." : "")
                : "Clinical imaging case",
              badge: "Community Case",
              image: img.file_path || img.thumbnail_path,
              thumbnail: img.thumbnail_path || img.file_path,
              bodyRegion: img.body_region || "Thorax & Lungs",
              clinicalSummary: img.description || "Clinical presentation and imaging findings uploaded to ImgBB.",
              patientAge: 48,
              patientGender: "Male" as const,
              history: img.description || "Patient clinical record and diagnostic imaging assessment.",
              annotations: [],
              caseroom: [
                {
                  id: `msg-db-${img.id}-1`,
                  senderName: img.uploader_name || "Contributing Clinician",
                  role: "Physician" as const,
                  avatarColor: "from-cyan-600 to-blue-600",
                  time: "Uploaded Case",
                  message: img.description || "Clinical case uploaded and available for collaborative diagnostic review.",
                },
              ],
              news: [],
              academic: [],
            };
          });

          setCohortScans((prev) => {
            const existingIds = new Set(INITIAL_MEDICAL_SCANS.map((s) => s.id));
            const allNew: MedicalScanItem[] = [];
            for (const s of [...fetchedScans, ...cachedScans]) {
              if (!existingIds.has(s.id)) {
                existingIds.add(s.id);
                allNew.push(s);
              }
            }
            return [...allNew, ...INITIAL_MEDICAL_SCANS];
          });
        } else if (cachedScans.length > 0) {
          setCohortScans((prev) => {
            const existingIds = new Set(INITIAL_MEDICAL_SCANS.map((s) => s.id));
            const allNew = cachedScans.filter((s) => !existingIds.has(s.id));
            return [...allNew, ...INITIAL_MEDICAL_SCANS];
          });
        }
      } catch (err) {
        console.warn("[page] Community scans load note:", err);
      }
    }

    loadCommunityScans();
  }, []);

  // Initialize geo settings & clock timer
  useEffect(() => {
    setGeoSettings(hasStoredGeoSettings() ? getStoredGeoSettings() : DEFAULT_LOCATION);

    const handleGeoChange = () => {
      setGeoSettings(getStoredGeoSettings());
    };
    window.addEventListener("geoSettingsChanged", handleGeoChange);

    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      window.removeEventListener("geoSettingsChanged", handleGeoChange);
      clearInterval(timer);
    };
  }, []);

  // Restore authenticated supporter state on load
  useEffect(() => {
    const storedUser = readStorage("tmh_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUser({
          id: parsed.id,
          email: parsed.email,
          fullName: parsed.full_name || parsed.fullName || "Alex Lee",
          role: parsed.role || "supporter",
          profession: parsed.profession,
          phoneNumber: parsed.phone_number || parsed.phoneNumber,
          address: parsed.address,
          comments: parsed.supporter_comments || parsed.comments,
          appTag: parsed.app_tag || parsed.appTag || APP_TAG,
        });
      } catch (e) {
        console.error("Failed to parse cached user:", e);
      }
    }

    // The callback receives this app's UserProfile (see lib/firebase.ts), not a Firebase User.
    const unsubscribe = onAuthStateChanged(auth, (fbUser: UserProfile | null) => {
      if (fbUser) {
        setCurrentUser((prev) => ({
          id: prev?.id,
          firebaseUid: fbUser.firebaseUid,
          email: fbUser.email || prev?.email || "",
          fullName: prev?.fullName || fbUser.fullName || "Alex Lee",
          role: prev?.role || "supporter",
          profession: prev?.profession,
          phoneNumber: prev?.phoneNumber,
          address: prev?.address,
          comments: prev?.comments,
          appTag: APP_TAG,
          photoURL: fbUser.photoURL,
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle global search query for conditions
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCondition.trim()) return;

    const term = searchCondition.trim().toLowerCase();
    const found = cohortScans.find(
      (s) =>
        s.finding.toLowerCase().includes(term) ||
        s.title.toLowerCase().includes(term) ||
        s.category.toLowerCase().includes(term)
    );
    if (found) {
      setActiveScan(found);
      setMobileTab("viewer");
      setSearchMessage(null);
    } else {
      setSearchMessage(`No scan matches "${searchCondition.trim()}"`);
    }
  };

  // Handle selecting any document modality from the index
  const handleSelectDocumentModality = (item: { name: string; category: string; modality: string }) => {
    // Check if an existing scan matches
    const existing = cohortScans.find(
      (s) => s.title.toLowerCase().includes(item.name.toLowerCase()) || s.modality === item.modality
    );
    if (existing) {
      setActiveScan(existing);
    } else {
      // Create a contextual patient case for this modality
      const newScan: MedicalScanItem = {
        id: `scan-${Date.now()}`,
        category: item.category,
        title: item.name,
        modality: item.modality as any,
        patientCase: `#${Math.floor(1000 + Math.random() * 9000)}`,
        finding: `Diagnostic Evaluation - ${item.name}`,
        badge: item.name.toUpperCase(),
        image: activeScan.image,
        thumbnail: activeScan.thumbnail,
        bodyRegion: "Multimodal Diagnostic Investigation",
        clinicalSummary: `Diagnostic investigation utilizing ${item.name} for acute remote healthcare triage.`,
        patientAge: 48,
        patientGender: "Male",
        history: `Patient undergoing diagnostic evaluation with ${item.name}.`,
        annotations: activeScan.annotations,
        caseroom: [
          {
            id: `msg-${Date.now()}-1`,
            senderName: "Dr. Sarah Jennings",
            role: "Physician",
            avatarColor: "from-blue-600 to-cyan-600",
            time: "Just now",
            message: `Reviewing the ${item.name} findings. How does this modality complement our clinical differential diagnosis?`,
          },
          {
            id: `msg-${Date.now()}-2`,
            senderName: "Prof. Marcus Vance",
            role: "Teacher",
            avatarColor: "from-amber-600 to-orange-600",
            time: "Just now",
            message: `Notice the specific imaging indications for ${item.name}. In remote health outposts, optimizing sequence selection is critical.`,
          },
        ],
        news: activeScan.news,
        academic: activeScan.academic,
      };

      setCohortScans((prev) => [newScan, ...prev]);
      setActiveScan(newScan);
    }
    setMobileTab("viewer");
  };

  const handleUploadScan = (newScan: MedicalScanItem) => {
    setCohortScans((prev) => {
      const exists = prev.some((s) => s.id === newScan.id);
      const updated = exists ? prev.map((s) => (s.id === newScan.id ? newScan : s)) : [newScan, ...prev];
      const customOnly = updated.filter((s) => s.id.startsWith("scan-"));
      writeStorage("tmh_uploaded_scans", JSON.stringify(customOnly));
      return updated;
    });
    setActiveScan(newScan);
    setMobileTab("viewer");
  };

  const handleOpenUploadModal = () => {
    if (!currentUser) {
      setIsSupportPrompt(false);
      setAuthModalMode("login");
      setIsAuthModalOpen(true);
    } else {
      setIsUploadModalOpen(true);
    }
  };

  const handleSupportLmsClick = () => {
    if (!currentUser) {
      // Force guest to register first to become a supporter
      setIsSupportPrompt(true);
      setAuthModalMode("register");
      setIsAuthModalOpen(true);
    } else {
      // Already a registered supporter: open payment gateway directly
      setProfileFocusPayment(true);
      setIsProfileModalOpen(true);
    }
  };

  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const handleDirectGoogleAuth = async () => {
    setIsAuthLoading(true);
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
          profession: backendResult.profession,
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

      saveSupporterToFirestore(user.uid, {
        email: user.email,
        fullName: user.displayName,
        profession: profile.profession,
        role: "supporter",
        appTag: APP_TAG,
      });

      setCurrentUser(profile);

      // When registering or if profession is not yet provided, open Registered Personal Details
      if (!profile.profession) {
        setProfileFocusPayment(false);
        setIsProfileModalOpen(true);
      }
    } catch (err: any) {
      console.error("Direct Google auth error:", err);
      setIsAuthModalOpen(true);
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#070b11] text-gray-200 font-sans select-none overflow-x-hidden">
      {/* Top Header matching mockup exactly */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-2.5 bg-[#0d141f] border-b border-[#182332] z-30 shrink-0 gap-3">
        {/* Left: TEACH ME Healthcare Brand Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex flex-col leading-none">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base tracking-wider text-cyan-400 uppercase">
                TEACH ME
              </span>
              <span className="font-bold text-sm sm:text-base tracking-tight text-white">
                Healthcare
              </span>
            </div>
            <span className="text-[9px] font-mono text-gray-400 mt-0.5 hidden sm:inline">
              Remote Healthcare Training LMS • Tag: {APP_TAG}
            </span>
          </div>
        </div>

        {/* Center: Search medical conditions bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex-1 max-w-xl mx-2 hidden md:block"
        >
          <div className="relative">
            <input
              type="text"
              value={searchCondition}
              onChange={(e) => {
                setSearchCondition(e.target.value);
                setSearchMessage(null);
              }}
              placeholder="Search medical conditions (e.g., Pneumonia, Atelectasis, Pleural Effusion...)"
              className="w-full bg-[#131c2a] border border-[#223145] rounded-full py-1.5 pl-9 pr-4 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 shadow-inner transition-colors"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            {searchMessage && (
              <div
                role="status"
                className="absolute left-4 top-full mt-1 px-2 py-0.5 rounded bg-[#131c2a] border border-[#223145] text-[11px] text-amber-300 shadow z-40"
              >
                {searchMessage}
              </div>
            )}
          </div>
        </form>

        {/* Right: Upload Scan Button & Google Auth / Profile */}
        <div className="flex items-center gap-2 shrink-0">
          {!currentUser ? (
            <>
              <button
                type="button"
                onClick={handleOpenUploadModal}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#131c2a] hover:bg-[#182436] text-cyan-400 hover:text-cyan-300 text-xs font-semibold border border-cyan-800/50 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                title="Sign in to upload medical scans"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Scan</span>
              </button>

              <button
                type="button"
                id="google-auth-button"
                onClick={handleDirectGoogleAuth}
                disabled={isAuthLoading}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-900 text-xs font-bold shadow-md border border-gray-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                title="Login or Register with Google"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                <span>{isAuthLoading ? "Connecting to Google..." : "Login / Register"}</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md border border-cyan-400/40 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
                title="Upload Medical Scan & Clinical Description to ImgBB"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Upload Scan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileFocusPayment(false);
                  setIsProfileModalOpen(true);
                }}
                className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#131c2a] border border-[#223145] hover:border-cyan-500/50 cursor-pointer transition-colors shadow-sm"
                title="Profile & Settings"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.fullName}
                    className="w-5 h-5 rounded-full object-cover border border-cyan-400"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-[10px]">
                    {currentUser.fullName ? currentUser.fullName[0].toUpperCase() : "U"}
                  </div>
                )}
                <span className="text-xs font-semibold text-white max-w-[120px] truncate">
                  {currentUser.fullName}
                </span>
                {currentUser.profession && (
                  <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-medium truncate max-w-[110px]">
                    {currentUser.profession}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentUser(null);
                  logOutUser();
                }}
                className="px-2 py-1 text-[11px] text-gray-400 hover:text-white rounded hover:bg-[#182332] transition-colors"
                title="Log Out"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Universal Navigation Tabs (for viewports <768px) */}
      <div className="flex md:hidden bg-[#0d141f] border-b border-[#182332] px-2 py-1.5 text-xs gap-1 overflow-x-auto shrink-0 scrollbar-none">
        <button
          onClick={handleOpenUploadModal}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#131c2a] text-cyan-400 hover:text-cyan-300 transition-colors whitespace-nowrap font-medium"
          title="Upload Medical Scan"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload</span>
        </button>
        <button
          onClick={() => setMobileTab("viewer")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            mobileTab === "viewer"
              ? "bg-cyan-600 text-white font-medium"
              : "bg-[#131c2a] text-gray-400 hover:text-white"
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Viewer</span>
        </button>

        <button
          onClick={() => setMobileTab("scans")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            mobileTab === "scans"
              ? "bg-cyan-600 text-white font-medium"
              : "bg-[#131c2a] text-gray-400 hover:text-white"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Related Scans</span>
        </button>

        <button
          onClick={() => setMobileTab("caseroom")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            mobileTab === "caseroom"
              ? "bg-cyan-600 text-white font-medium"
              : "bg-[#131c2a] text-gray-400 hover:text-white"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Classroom Chat</span>
        </button>

        <button
          onClick={() => setMobileTab("news")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            mobileTab === "news"
              ? "bg-cyan-600 text-white font-medium"
              : "bg-[#131c2a] text-gray-400 hover:text-white"
          }`}
        >
          <Newspaper className="w-3.5 h-3.5" />
          <span>Regional News</span>
        </button>

        <button
          onClick={() => setMobileTab("academic")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            mobileTab === "academic"
              ? "bg-cyan-600 text-white font-medium"
              : "bg-[#131c2a] text-gray-400 hover:text-white"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>NCBI Research</span>
        </button>
      </div>

      {/* Main Medical Stage - Workstation Layout */}
      <main className="flex-1 p-2 sm:p-4 overflow-y-auto flex flex-col gap-4">
        {/* Workstation Top Section: Scans (Left) + The Scan (Center) + Collaborative Classroom (Right) */}
        <div className="hidden md:flex items-stretch gap-2.5 lg:gap-3 min-h-[540px] xl:min-h-[580px]">
          {/* Left Column: Related Scans (visible on xl >= 1280px) */}
          <aside className="hidden xl:flex w-[260px] 2xl:w-[280px] shrink-0 flex-col h-full">
            <RelatedScansPanel
              scans={cohortScans}
              activeScanId={activeScan.id}
              onSelectScan={(s) => setActiveScan(s)}
              onSelectDocumentModality={handleSelectDocumentModality}
              onUploadScan={handleUploadScan}
              onOpenUploadModal={handleOpenUploadModal}
            />
          </aside>

          {/* Center Column: Diagnostic Viewer (The Scan) */}
          <section className="flex-1 flex flex-col min-w-0 h-full">
            {/* Quick Cohort Scans Bar for md/lg viewports (< 1280px) */}
            <div className="flex xl:hidden items-center justify-between px-3 py-1.5 mb-2 bg-[#101722] border border-[#1b2636] rounded-lg text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-[11px]">Active Scan:</span>
                <span className="font-semibold text-cyan-300 text-[11px] truncate max-w-[200px]">
                  {activeScan.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenUploadModal}
                  className="px-2.5 py-1 rounded bg-cyan-700/80 hover:bg-cyan-600 text-white text-[11px] font-medium transition-colors flex items-center gap-1 shadow-sm"
                  title="Upload image & clinical description"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsScansDrawerOpen(true)}
                  className="px-2.5 py-1 rounded bg-[#182332] hover:bg-cyan-600/30 text-cyan-400 hover:text-cyan-200 border border-cyan-800/50 text-[11px] font-medium transition-colors flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Related Scans ({cohortScans.length})</span>
                </button>
              </div>
            </div>

            <DiagnosticViewer scan={activeScan} />
          </section>

          {/* Right Column: COLLABORATIVE CLASSROOM PANEL ON THE RIGHT HAND SIDE */}
          <aside className="w-[330px] lg:w-[360px] xl:w-[400px] 2xl:w-[420px] shrink-0 flex flex-col h-full">
            <CollaborativeCaseroom
              scan={activeScan}
              currentUserName={currentUser?.fullName || "Alex Lee"}
            />
          </aside>
        </div>

        {/* SEPARATE PANEL UNDER THE SCAN AND COLLABORATIVE CLASSROOM: NEWS & ACADEMIC ARTICLES */}
        <div className="hidden md:flex flex-col gap-3 rounded-xl border border-[#1b2636] bg-[#0c121b] p-3.5 sm:p-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#1b2636] pb-2.5">
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-cyan-400" />
              <h2 className="font-bold text-white text-xs sm:text-sm tracking-wide uppercase">
                CLINICAL EPIDEMIOLOGY & ACADEMIC RESEARCH PANEL
              </h2>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-[10px] font-mono">
                Under Scan & Classroom
              </span>
            </div>
            <div className="text-[11px] text-gray-400 hidden sm:block">
              Regional Health & Academic Database
            </div>
          </div>

          {/* 2-Column Grid inside the separate panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {/* 1. Localized Regional News (Title, Excerpt, [Read] Button) */}
            <LocalizedRegionalNews
              articles={activeScan.news}
              suburb={geoSettings.suburb}
              state={geoSettings.state}
            />

            {/* 2. Academic Research Articles via Google Scholar & NCBI / PubMed */}
            <AcademicResearch articles={activeScan.academic} activeCondition={activeScan.finding} />
          </div>
        </div>

        {/* Mobile View (< 768px) */}
        <div className="flex md:hidden flex-1 flex-col overflow-y-auto">
          {mobileTab === "viewer" && <DiagnosticViewer scan={activeScan} />}

          {mobileTab === "scans" && (
            <RelatedScansPanel
              scans={cohortScans}
              activeScanId={activeScan.id}
              onSelectScan={(s) => {
                setActiveScan(s);
                setMobileTab("viewer");
              }}
              onSelectDocumentModality={handleSelectDocumentModality}
              onUploadScan={(s) => {
                handleUploadScan(s);
                setMobileTab("viewer");
              }}
            />
          )}

          {mobileTab === "caseroom" && (
            <CollaborativeCaseroom
              scan={activeScan}
              currentUserName={currentUser?.fullName || "Alex Lee"}
            />
          )}

          {mobileTab === "news" && (
            <LocalizedRegionalNews
              articles={activeScan.news}
              suburb={geoSettings.suburb}
              state={geoSettings.state}
            />
          )}

          {mobileTab === "academic" && (
            <AcademicResearch
              articles={activeScan.academic}
              activeCondition={activeScan.finding}
            />
          )}
        </div>
      </main>

      {/* Bottom Footer Bar with Ecosystem Links & Small Geolocation Button */}
      <footer className="flex flex-wrap items-center justify-between px-3 sm:px-6 py-2 bg-[#0d141f] border-t border-[#182332] text-xs shrink-0 gap-2 z-20">
        {/* Left: AI Foundation Ecosystem Links */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mr-1">
            Ecosystem:
          </span>
          {[
            { label: "AI", href: "https://www.aifoundation.net.au/", desc: "AI Foundation" },
            { label: "LMS", href: "https://lms.aifoundation.net.au/", desc: "TeachMeHealth LMS" },
            { label: "HR", href: "http://hr.aifoundation.net.au/", desc: "Healthcare HR" },
            { label: "Trades", href: "https://jobs.aifoundation.net.au/", desc: "Trades & Jobs" },
            { label: "PT", href: "https://pt.aifoundation.net.au/", desc: "Patient Transport" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#131c2a] hover:bg-cyan-900/30 border border-[#223145] hover:border-cyan-500/50 text-[11px] font-medium text-gray-300 hover:text-cyan-300 transition-colors shadow-sm"
              title={`${item.desc} (${item.href})`}
            >
              <span>{item.label}</span>
              <ExternalLink className="w-2.5 h-2.5 text-gray-500 opacity-70" />
            </a>
          ))}
        </div>

        {/* Right: The ONLY Geotag Button on the Entire Webpage (Bottom Right) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="geotag-button"
            onClick={() => setIsGeoModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#131c2a] hover:bg-[#1a2538] border border-cyan-800/60 hover:border-cyan-400 text-[11px] text-gray-300 hover:text-white transition-all shadow-sm group"
            title="Configure regional geotag, closest suburb, state, timezone & date/time format"
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
            <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-300 text-[10px] font-mono font-bold tracking-wider uppercase">
              Geotag
            </span>
            <span className="font-semibold text-white">
              {geoSettings.suburb}, {geoSettings.state}
            </span>
            <span className="text-gray-600">|</span>
            <span className="font-mono text-cyan-300 text-[10px]">
              {currentTime ? formatDateTime(currentTime, geoSettings, true) : ""}
            </span>
            <Sliders className="w-3 h-3 text-gray-400 group-hover:text-cyan-400 ml-0.5 shrink-0" />
          </button>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setIsSupportPrompt(false);
        }}
        initialMode={authModalMode}
        supportPrompt={isSupportPrompt}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          // Once registered as supporter, open the Support Teach Me Healthcare payment gateway
          setIsSupportPrompt(false);
          setProfileFocusPayment(true);
          setIsProfileModalOpen(true);
        }}
      />

      {currentUser && (
        <SupporterProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={currentUser}
          focusPayment={profileFocusPayment}
          onUserUpdate={(updated) => {
            setCurrentUser(updated);
            writeStorage("tmh_user", JSON.stringify(updated));
          }}
          onLogOut={() => {
            setCurrentUser(null);
            logOutUser();
          }}
        />
      )}

      <GeolocationModal
        isOpen={isGeoModalOpen}
        onClose={() => setIsGeoModalOpen(false)}
        settings={geoSettings}
        onSettingsChange={(newSettings) => {
          setGeoSettings(newSettings);
        }}
      />

      {/* Scans Drawer Modal for md / lg screens (< 1280px) */}
      {isScansDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#101722] border border-[#22334a] rounded-xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-3 bg-[#141d2b] border-b border-[#22334a] flex items-center justify-between">
              <span className="font-semibold text-white text-xs">Cohort Scans & Modalities</span>
              <button
                type="button"
                onClick={() => setIsScansDrawerOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <RelatedScansPanel
                scans={cohortScans}
                activeScanId={activeScan.id}
                onSelectScan={(s) => {
                  setActiveScan(s);
                  setIsScansDrawerOpen(false);
                }}
                onSelectDocumentModality={(item) => {
                  handleSelectDocumentModality(item);
                  setIsScansDrawerOpen(false);
                }}
                onUploadScan={(s) => {
                  handleUploadScan(s);
                  setIsScansDrawerOpen(false);
                }}
                onOpenUploadModal={() => {
                  setIsScansDrawerOpen(false);
                  handleOpenUploadModal();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Upload Scan & Clinical Description Modal */}
      <UploadScanModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onScanUploaded={handleUploadScan}
        currentUser={currentUser}
      />
    </div>
  );
}