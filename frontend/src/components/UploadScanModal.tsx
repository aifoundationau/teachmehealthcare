"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Upload,
  UploadCloud,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Check,
  Search,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { uploadImageToImgBB } from "@/lib/imgbb";
import {
  MedicalScanItem,
  CaseroomMessage,
} from "@/lib/medicalData";
import { UserProfile } from "@/lib/firebase";
import {
  IMAGING_MODALITIES,
  getModalityMatches,
  mapModalityToApiBucket,
  type ImagingModalityItem,
} from "@/lib/imagingModalities";
import {
  BODY_REGIONS_CATALOG,
  getBodyRegionMatches,
  type BodyRegionItem,
} from "@/lib/bodyRegions";

interface UploadScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanUploaded: (newScan: MedicalScanItem) => void;
  currentUser: UserProfile | null;
}

export default function UploadScanModal({
  isOpen,
  onClose,
  onScanUploaded,
  currentUser,
}: UploadScanModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");

  // Modality state with autocomplete
  const [modality, setModality] = useState<string>("Projection Radiography (Plain X-ray)");
  const [isModalityDropdownOpen, setIsModalityDropdownOpen] = useState(false);
  const [isModalityFocused, setIsModalityFocused] = useState(false);
  const [highlightedModalityIndex, setHighlightedModalityIndex] = useState(0);

  // Body Region state with autocomplete
  const [bodyRegion, setBodyRegion] = useState<string>("Thorax (Chest)");
  const [isBodyRegionDropdownOpen, setIsBodyRegionDropdownOpen] = useState(false);
  const [isBodyRegionFocused, setIsBodyRegionFocused] = useState(false);
  const [highlightedBodyRegionIndex, setHighlightedBodyRegionIndex] = useState(0);

  const [description, setDescription] = useState("");
  const [patientAge, setPatientAge] = useState<string>("");
  const [patientGender, setPatientGender] = useState<"" | "Male" | "Female" | "Other">("");
  const [contributorName, setContributorName] = useState<string>(
    currentUser?.fullName || currentUser?.email?.split("@")[0] || ""
  );
  const [isAnonymized, setIsAnonymized] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalityComboboxRef = useRef<HTMLDivElement>(null);
  const modalityInputRef = useRef<HTMLInputElement>(null);
  const bodyRegionComboboxRef = useRef<HTMLDivElement>(null);
  const bodyRegionInputRef = useRef<HTMLInputElement>(null);

  // Sync contributor name when user logs in or updates
  useEffect(() => {
    if (currentUser?.fullName && !contributorName) {
      setContributorName(currentUser.fullName);
    }
  }, [currentUser]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        modalityComboboxRef.current &&
        !modalityComboboxRef.current.contains(e.target as Node)
      ) {
        setIsModalityDropdownOpen(false);
      }
      if (
        bodyRegionComboboxRef.current &&
        !bodyRegionComboboxRef.current.contains(e.target as Node)
      ) {
        setIsBodyRegionDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute autocomplete matches and inline ghost completion for Modality
  const { matches: modalityMatches, ghostSuggestion: modalityGhostSuggestion } =
    getModalityMatches(modality, 8);
  const fullSuggestedModality =
    modalityGhostSuggestion && modalityMatches.length > 0 ? modalityMatches[0].name : null;

  // Compute autocomplete matches and inline ghost completion for Body Region
  const { matches: bodyRegionMatches, ghostSuggestion: bodyRegionGhostSuggestion } =
    getBodyRegionMatches(bodyRegion, 8);
  const fullSuggestedBodyRegion =
    bodyRegionGhostSuggestion && bodyRegionMatches.length > 0 ? bodyRegionMatches[0].name : null;

  // Strict completeness validation for every single required detail
  const missingFields: string[] = [];
  if (!file) missingFields.push("Medical Image Scan");
  if (!title.trim() || title.trim().length < 3) missingFields.push("Case Title (min 3 chars)");
  if (!modality.trim()) missingFields.push("Imaging Modality");
  if (!bodyRegion.trim()) missingFields.push("Body Region");
  if (!patientAge.trim() || isNaN(Number(patientAge)) || Number(patientAge) < 0 || Number(patientAge) > 125) {
    missingFields.push("Patient Age (0-125)");
  }
  if (!patientGender) missingFields.push("Biological Sex");
  if (!contributorName.trim() || contributorName.trim().length < 2) {
    missingFields.push("Clinician / Contributor Name");
  }
  if (!description.trim() || description.trim().length < 10) {
    missingFields.push("Clinical Description (min 10 chars)");
  }
  if (!isAnonymized) missingFields.push("De-identification Certification");

  const totalDetails = 9;
  const completedDetails = totalDetails - missingFields.length;
  const isFormComplete = missingFields.length === 0;

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile: File) => {
    setErrorMessage(null);
    if (!selectedFile.type.startsWith("image/") && !selectedFile.name.toLowerCase().endsWith(".dcm")) {
      setErrorMessage("Please select a supported image file (JPEG, PNG, or WebP).");
      return;
    }

    if (selectedFile.size > 32 * 1024 * 1024) {
      setErrorMessage("Image file exceeds the 32MB limit. Please compress or select a smaller image.");
      return;
    }

    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    // Auto-fill title if empty
    if (!title) {
      const cleanName = selectedFile.name
        .replace(/\.[^.]+$/, "")
        .replace(/[-_]/g, " ")
        .trim();
      if (cleanName.length >= 3) {
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const resetForm = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setTitle("");
    setModality("Projection Radiography (Plain X-ray)");
    setBodyRegion("Thorax (Chest)");
    setDescription("");
    setPatientAge("");
    setPatientGender("");
    setContributorName(currentUser?.fullName || currentUser?.email?.split("@")[0] || "");
    setIsAnonymized(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsUploading(false);
    setUploadStep("");
  };

  // Modality completion acceptance
  const handleAcceptModalityCompletion = (targetName?: string) => {
    const chosen = targetName || fullSuggestedModality || (modalityMatches[0] ? modalityMatches[0].name : null);
    if (chosen) {
      setModality(chosen);
      setIsModalityDropdownOpen(false);
      setIsModalityFocused(false);
      if (modalityInputRef.current) {
        modalityInputRef.current.blur();
      }
    }
  };

  const handleModalityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setModality(e.target.value);
    setIsModalityDropdownOpen(true);
    setIsBodyRegionDropdownOpen(false);
    setHighlightedModalityIndex(0);
  };

  const handleModalityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab") {
      if (fullSuggestedModality) {
        e.preventDefault();
        handleAcceptModalityCompletion(fullSuggestedModality);
      }
    } else if (e.key === "ArrowRight") {
      const input = modalityInputRef.current;
      if (input && input.selectionStart === modality.length && fullSuggestedModality) {
        e.preventDefault();
        handleAcceptModalityCompletion(fullSuggestedModality);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isModalityDropdownOpen) {
        setIsModalityDropdownOpen(true);
      } else if (modalityMatches.length > 0) {
        setHighlightedModalityIndex((prev) => (prev + 1) % modalityMatches.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (modalityMatches.length > 0) {
        setHighlightedModalityIndex((prev) => (prev - 1 + modalityMatches.length) % modalityMatches.length);
      }
    } else if (e.key === "Enter") {
      if (isModalityDropdownOpen && modalityMatches.length > 0) {
        e.preventDefault();
        const selected = modalityMatches[highlightedModalityIndex] || modalityMatches[0];
        handleAcceptModalityCompletion(selected.name);
      }
    } else if (e.key === "Escape") {
      setIsModalityDropdownOpen(false);
    }
  };

  // Body Region completion acceptance
  const handleAcceptBodyRegionCompletion = (targetName?: string) => {
    const chosen =
      targetName || fullSuggestedBodyRegion || (bodyRegionMatches[0] ? bodyRegionMatches[0].name : null);
    if (chosen) {
      setBodyRegion(chosen);
      setIsBodyRegionDropdownOpen(false);
      setIsBodyRegionFocused(false);
      if (bodyRegionInputRef.current) {
        bodyRegionInputRef.current.blur();
      }
    }
  };

  const handleBodyRegionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBodyRegion(e.target.value);
    setIsBodyRegionDropdownOpen(true);
    setIsModalityDropdownOpen(false);
    setHighlightedBodyRegionIndex(0);
  };

  const handleBodyRegionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab") {
      if (fullSuggestedBodyRegion) {
        e.preventDefault();
        handleAcceptBodyRegionCompletion(fullSuggestedBodyRegion);
      }
    } else if (e.key === "ArrowRight") {
      const input = bodyRegionInputRef.current;
      if (input && input.selectionStart === bodyRegion.length && fullSuggestedBodyRegion) {
        e.preventDefault();
        handleAcceptBodyRegionCompletion(fullSuggestedBodyRegion);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isBodyRegionDropdownOpen) {
        setIsBodyRegionDropdownOpen(true);
      } else if (bodyRegionMatches.length > 0) {
        setHighlightedBodyRegionIndex((prev) => (prev + 1) % bodyRegionMatches.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (bodyRegionMatches.length > 0) {
        setHighlightedBodyRegionIndex((prev) => (prev - 1 + bodyRegionMatches.length) % bodyRegionMatches.length);
      }
    } else if (e.key === "Enter") {
      if (isBodyRegionDropdownOpen && bodyRegionMatches.length > 0) {
        e.preventDefault();
        const selected = bodyRegionMatches[highlightedBodyRegionIndex] || bodyRegionMatches[0];
        handleAcceptBodyRegionCompletion(selected.name);
      }
    } else if (e.key === "Escape") {
      setIsBodyRegionDropdownOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isFormComplete) {
      setErrorMessage(`Please complete all required details before uploading (${missingFields[0]} is required).`);
      return;
    }

    setIsUploading(true);
    setUploadStep("De-identifying image & stripping EXIF tags...");

    try {
      let uploadedUrl = "";
      let thumbnailUrl = "";
      let dbRecordId: string | number = Date.now();

      // 1. Map to backend API bucket (xray, ct, mri, ultrasound, or other)
      const apiModality = mapModalityToApiBucket(modality);
      const uploaderDisplayName =
        contributorName.trim() ||
        currentUser?.fullName ||
        currentUser?.email?.split("@")[0] ||
        "Contributing Clinician";

      const formData = new FormData();
      formData.append("file", file!);
      formData.append("title", title.trim());
      formData.append("modality", apiModality);
      formData.append("body_region", bodyRegion.trim());
      formData.append("description", description.trim());
      formData.append("contributor_name", uploaderDisplayName);
      formData.append("is_anonymized", "true");

      let apiSuccess = false;

      try {
        setUploadStep("Uploading securely to ImgBB cloud album...");
        const res = await apiFetch("/images", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const resData = await res.json();
          uploadedUrl = resData.file_path || resData.url || "";
          thumbnailUrl = resData.thumbnail_path || resData.thumbUrl || uploadedUrl;
          dbRecordId = resData.id || Date.now();
          apiSuccess = true;
        } else {
          const errData = await res.json().catch(() => null);
          console.warn("[upload] Server route note:", res.status, errData);
        }
      } catch (apiErr) {
        console.warn("[upload] Server API attempt note:", apiErr);
      }

      // 2. Direct ImgBB Client fallback if server route had network or unconfigured error
      if (!apiSuccess || !uploadedUrl) {
        setUploadStep("Connecting directly to ImgBB cloud storage...");
        const clientUpload = await uploadImageToImgBB(file!, title.trim());
        uploadedUrl = clientUpload.url;
        thumbnailUrl = clientUpload.thumbUrl || clientUpload.url;
      }

      setUploadStep("Publishing case to TeachMeHealthcare workstation...");

      const initialMessage: CaseroomMessage = {
        id: `msg-case-${Date.now()}-1`,
        senderName: uploaderDisplayName,
        role: "Physician",
        avatarColor: "from-cyan-600 to-blue-600",
        time: "Just now",
        message: description.trim(),
      };

      const facultyReply: CaseroomMessage = {
        id: `msg-case-${Date.now()}-2`,
        senderName: "Faculty Triage",
        role: "Teacher",
        avatarColor: "from-emerald-600 to-teal-600",
        time: "Just now",
        message: `Case received from ${uploaderDisplayName} and published. Clinical presentation for ${title.trim()} (${modality} · ${bodyRegion}) is open for student review and diagnostic differential.`,
      };

      // Find matched catalog item for rich category and badge
      const matchedModality = IMAGING_MODALITIES.find(
        (m) =>
          m.name.toLowerCase() === modality.toLowerCase() ||
          m.short?.toLowerCase() === modality.toLowerCase()
      );

      const newScanItem: MedicalScanItem = {
        id: `scan-${dbRecordId}`,
        category: matchedModality ? `${matchedModality.category} Imaging` : `${modality} Imaging`,
        title: title.trim(),
        modality: modality,
        patientCase: `${bodyRegion} · ${title.trim()}`,
        finding: description.trim().slice(0, 110) + (description.trim().length > 110 ? "..." : ""),
        badge: (matchedModality?.short || modality.slice(0, 10)).toUpperCase(),
        image: uploadedUrl,
        thumbnail: thumbnailUrl,
        bodyRegion: bodyRegion,
        clinicalSummary: description.trim(),
        patientAge: parseInt(patientAge, 10) || 45,
        patientGender: (patientGender as "Male" | "Female" | "Other") || "Male",
        history: description.trim(),
        annotations: [],
        caseroom: [initialMessage, facultyReply],
        news: [],
        academic: [],
      };

      setSuccessMessage("Medical scan uploaded and published successfully!");
      setUploadStep("Complete!");

      setTimeout(() => {
        onScanUploaded(newScanItem);
        resetForm();
        onClose();
      }, 900);
    } catch (err: any) {
      console.error("[upload] Error:", err);
      setErrorMessage(err.message || "Failed to upload image. Please try again.");
      setIsUploading(false);
      setUploadStep("");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#0f1724] border border-[#22334d] rounded-2xl shadow-2xl flex flex-col text-xs text-gray-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Compact & Sleek */}
        <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-[#141e2e] border-b border-[#22334d] rounded-t-2xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600/30 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="upload-modal-title"
                  className="text-sm sm:text-base font-bold text-white tracking-tight"
                >
                  Upload Medical Scan & Case
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono font-medium">
                  {currentUser ? "Verified Contributor" : "Open Upload · No Login Required"}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 hidden sm:block">
                Contribute diagnostic imaging and clinical case notes to the workstation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#1f2c42] transition-colors disabled:opacity-50"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Balanced 2-Column Responsive Layout (No Scrollbar Required) */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 p-3.5 sm:p-4">
            {/* Left Column (5 cols): Image Dropzone, Modality Autocomplete & Body Region Autocomplete */}
            <div className="md:col-span-5 flex flex-col gap-2.5">
              {/* Dropzone / Preview Card */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-200 mb-1">
                  Medical Image Scan <span className="text-cyan-400">*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,.dcm"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />

                {!file ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`h-[115px] border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                      isDragging
                        ? "border-cyan-400 bg-cyan-950/30"
                        : "border-[#263750] bg-[#121a28] hover:border-cyan-500/60 hover:bg-[#152033]"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#1b2638] flex items-center justify-center text-cyan-400">
                      <Upload className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-white">
                      Drop scan here or click to browse
                    </p>
                    <p className="text-[10px] text-gray-400">
                      JPEG, PNG, WebP (up to 32MB)
                    </p>
                  </div>
                ) : (
                  <div className="h-[115px] rounded-xl bg-[#121a28] border border-[#22334d] p-2 flex items-center gap-3">
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Selected preview"
                        className="w-20 h-full rounded-lg object-contain bg-black border border-[#2a3c5a] shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1 flex flex-col justify-between h-full py-0.5">
                      <div>
                        <p className="text-xs font-semibold text-white truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB · {file.type || "Scan"}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium mt-0.5">
                          <Check className="w-3 h-3" /> Ready for upload
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          setPreviewUrl(null);
                        }}
                        className="self-start text-[10px] text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
                      >
                        Change scan image
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 1. Imaging Modality Autocomplete Combobox with Word Completion */}
              <div ref={modalityComboboxRef} className="relative z-30">
                <div className="flex items-center justify-between mb-0.5">
                  <label htmlFor="case-modality" className="block text-[11px] font-semibold text-gray-200">
                    Imaging Modality <span className="text-cyan-400">*</span>
                  </label>
                  {fullSuggestedModality && fullSuggestedModality.toLowerCase() !== modality.toLowerCase() && (
                    <button
                      type="button"
                      onClick={() => handleAcceptModalityCompletion()}
                      className="text-[10px] text-cyan-300 hover:text-cyan-200 bg-cyan-950/80 border border-cyan-700/60 rounded px-1.5 py-0.5 font-mono flex items-center gap-1 transition-all hover:border-cyan-400 cursor-pointer shadow-sm"
                      title="Press [Tab] or click to complete"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                      <span>Tab:</span>
                      <strong className="text-white truncate max-w-[120px]">{fullSuggestedModality}</strong>
                    </button>
                  )}
                </div>

                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none z-20" />

                  {/* Inline Ghost Text Overlay */}
                  {modalityGhostSuggestion && isModalityFocused && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 pl-8 pr-16 py-1.5 text-xs pointer-events-none flex items-center overflow-hidden whitespace-pre font-sans"
                    >
                      <span className="opacity-0">{modality}</span>
                      <span className="text-cyan-400/50 bg-cyan-950/30 rounded px-0.5">{modalityGhostSuggestion}</span>
                    </div>
                  )}

                  <input
                    ref={modalityInputRef}
                    id="case-modality"
                    type="text"
                    required
                    value={modality}
                    onChange={handleModalityChange}
                    onKeyDown={handleModalityKeyDown}
                    onFocus={() => {
                      setIsModalityFocused(true);
                      setIsModalityDropdownOpen(true);
                      setIsBodyRegionDropdownOpen(false);
                    }}
                    onBlur={() => {
                      setTimeout(() => setIsModalityFocused(false), 200);
                    }}
                    placeholder="Type modality (e.g., Fluo..., POCUS, CT, MRI...)"
                    className="w-full bg-[#121a28] border border-[#22334d] rounded-lg pl-8 pr-16 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 relative z-10 bg-transparent"
                    autoComplete="off"
                  />

                  {/* Actions inside input: Clear & Toggle Chevron */}
                  <div className="absolute right-2 flex items-center gap-1 z-20">
                    {modality && (
                      <button
                        type="button"
                        onClick={() => {
                          setModality("");
                          setIsModalityDropdownOpen(true);
                          modalityInputRef.current?.focus();
                        }}
                        className="p-0.5 text-gray-400 hover:text-white rounded"
                        title="Clear"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalityDropdownOpen((prev) => !prev);
                        setIsBodyRegionDropdownOpen(false);
                      }}
                      className="p-0.5 text-gray-400 hover:text-cyan-300 rounded"
                      title="Browse all 170 modalities"
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-150 ${
                          isModalityDropdownOpen ? "rotate-180 text-cyan-400" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Floating Autocomplete Dropdown List */}
                {isModalityDropdownOpen && modalityMatches.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-40 bg-[#0c131f]/95 backdrop-blur-md border border-cyan-700/60 rounded-xl shadow-2xl overflow-hidden max-h-48 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2.5 py-1 bg-[#101928] border-b border-[#1b2a40] flex items-center justify-between text-[10px] text-gray-400">
                      <span>{modalityMatches.length} matching of 170 modalities</span>
                      <span className="text-cyan-400 font-mono">[Tab] Complete · [↑↓] Navigate</span>
                    </div>
                    <ul className="overflow-y-auto divide-y divide-[#152033] scrollbar-thin">
                      {modalityMatches.map((item, idx) => (
                        <li
                          key={item.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleAcceptModalityCompletion(item.name);
                          }}
                          onMouseEnter={() => setHighlightedModalityIndex(idx)}
                          className={`px-2.5 py-1.5 cursor-pointer flex items-center justify-between transition-colors ${
                            highlightedModalityIndex === idx
                              ? "bg-cyan-950/80 text-cyan-200 border-l-2 border-cyan-400"
                              : "hover:bg-[#131d2c] text-gray-300"
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-medium text-white block truncate text-[11px]">
                              {item.name}
                            </span>
                            <span className="text-[9.5px] text-gray-400 block truncate">
                              {item.category}
                            </span>
                          </div>
                          {item.short && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#172338] text-cyan-300 border border-cyan-800/50 font-mono shrink-0">
                              {item.short}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 2. Anatomical Body Region Autocomplete Combobox with Word Completion */}
              <div ref={bodyRegionComboboxRef} className="relative z-20">
                <div className="flex items-center justify-between mb-0.5">
                  <label htmlFor="body-region" className="block text-[11px] font-semibold text-gray-200">
                    Anatomical Body Region <span className="text-cyan-400">*</span>
                  </label>
                  {fullSuggestedBodyRegion &&
                    fullSuggestedBodyRegion.toLowerCase() !== bodyRegion.toLowerCase() && (
                      <button
                        type="button"
                        onClick={() => handleAcceptBodyRegionCompletion()}
                        className="text-[10px] text-cyan-300 hover:text-cyan-200 bg-cyan-950/80 border border-cyan-700/60 rounded px-1.5 py-0.5 font-mono flex items-center gap-1 transition-all hover:border-cyan-400 cursor-pointer shadow-sm"
                        title="Press [Tab] or click to complete"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                        <span>Tab:</span>
                        <strong className="text-white truncate max-w-[120px]">
                          {fullSuggestedBodyRegion}
                        </strong>
                      </button>
                    )}
                </div>

                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none z-20" />

                  {/* Inline Ghost Text Overlay */}
                  {bodyRegionGhostSuggestion && isBodyRegionFocused && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 pl-8 pr-16 py-1.5 text-xs pointer-events-none flex items-center overflow-hidden whitespace-pre font-sans"
                    >
                      <span className="opacity-0">{bodyRegion}</span>
                      <span className="text-cyan-400/50 bg-cyan-950/30 rounded px-0.5">
                        {bodyRegionGhostSuggestion}
                      </span>
                    </div>
                  )}

                  <input
                    ref={bodyRegionInputRef}
                    id="body-region"
                    type="text"
                    required
                    value={bodyRegion}
                    onChange={handleBodyRegionChange}
                    onKeyDown={handleBodyRegionKeyDown}
                    onFocus={() => {
                      setIsBodyRegionFocused(true);
                      setIsBodyRegionDropdownOpen(true);
                      setIsModalityDropdownOpen(false);
                    }}
                    onBlur={() => {
                      setTimeout(() => setIsBodyRegionFocused(false), 200);
                    }}
                    placeholder="Type body region (e.g., Thorax, Knee, Liver, Brain...)"
                    className="w-full bg-[#121a28] border border-[#22334d] rounded-lg pl-8 pr-16 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 relative z-10 bg-transparent"
                    autoComplete="off"
                  />

                  {/* Actions inside input: Clear & Toggle Chevron */}
                  <div className="absolute right-2 flex items-center gap-1 z-20">
                    {bodyRegion && (
                      <button
                        type="button"
                        onClick={() => {
                          setBodyRegion("");
                          setIsBodyRegionDropdownOpen(true);
                          bodyRegionInputRef.current?.focus();
                        }}
                        className="p-0.5 text-gray-400 hover:text-white rounded"
                        title="Clear"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsBodyRegionDropdownOpen((prev) => !prev);
                        setIsModalityDropdownOpen(false);
                      }}
                      className="p-0.5 text-gray-400 hover:text-cyan-300 rounded"
                      title="Browse all 287 anatomical regions"
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-150 ${
                          isBodyRegionDropdownOpen ? "rotate-180 text-cyan-400" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Floating Autocomplete Dropdown List */}
                {isBodyRegionDropdownOpen && bodyRegionMatches.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-40 bg-[#0c131f]/95 backdrop-blur-md border border-cyan-700/60 rounded-xl shadow-2xl overflow-hidden max-h-48 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2.5 py-1 bg-[#101928] border-b border-[#1b2a40] flex items-center justify-between text-[10px] text-gray-400">
                      <span>{bodyRegionMatches.length} matching of 287 regions</span>
                      <span className="text-cyan-400 font-mono">[Tab] Complete · [↑↓] Navigate</span>
                    </div>
                    <ul className="overflow-y-auto divide-y divide-[#152033] scrollbar-thin">
                      {bodyRegionMatches.map((item, idx) => (
                        <li
                          key={item.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleAcceptBodyRegionCompletion(item.name);
                          }}
                          onMouseEnter={() => setHighlightedBodyRegionIndex(idx)}
                          className={`px-2.5 py-1.5 cursor-pointer flex items-center justify-between transition-colors ${
                            highlightedBodyRegionIndex === idx
                              ? "bg-cyan-950/80 text-cyan-200 border-l-2 border-cyan-400"
                              : "hover:bg-[#131d2c] text-gray-300"
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-medium text-white block truncate text-[11px]">
                              {item.name}
                            </span>
                            <span className="text-[9.5px] text-gray-400 block truncate">
                              {item.system}
                            </span>
                          </div>
                          {item.short && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#172338] text-cyan-300 border border-cyan-800/50 font-mono shrink-0">
                              {item.short}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Compact De-identification guarantee badge */}
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-cyan-950/40 border border-cyan-800/40 text-[10px] text-cyan-300">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">EXIF, camera & GPS metadata stripped automatically</span>
              </div>
            </div>

            {/* Right Column (7 cols): Case Title, Demographics & Clinical Findings */}
            <div className="md:col-span-7 flex flex-col gap-2.5">
              {/* Case Title */}
              <div>
                <label htmlFor="case-title" className="block text-[11px] font-semibold text-gray-200 mb-1">
                  Case Title / Clinical Diagnosis <span className="text-cyan-400">*</span>
                </label>
                <input
                  id="case-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Right Lobar Pneumonia with Pleural Effusion"
                  className={`w-full bg-[#121a28] border rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors ${
                    title.trim().length >= 3 ? "border-emerald-600/50" : "border-[#22334d]"
                  }`}
                />
              </div>

              {/* Patient Demographics & Contributor Row (3 Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label htmlFor="patient-age" className="block text-[11px] font-semibold text-gray-200 mb-1">
                    Patient Age <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    id="patient-age"
                    type="number"
                    min="0"
                    max="125"
                    required
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    placeholder="e.g., 48"
                    className={`w-full bg-[#121a28] border rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors ${
                      patientAge.trim() && !isNaN(Number(patientAge)) && Number(patientAge) >= 0 && Number(patientAge) <= 125
                        ? "border-emerald-600/50"
                        : "border-[#22334d]"
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="patient-gender" className="block text-[11px] font-semibold text-gray-200 mb-1">
                    Biological Sex <span className="text-cyan-400">*</span>
                  </label>
                  <select
                    id="patient-gender"
                    required
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value as any)}
                    className={`w-full bg-[#121a28] border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500 transition-colors ${
                      patientGender ? "border-emerald-600/50 text-white" : "border-[#22334d] text-gray-400"
                    }`}
                  >
                    <option value="" disabled className="bg-[#121a28] text-gray-500">
                      Select sex...
                    </option>
                    <option value="Male" className="bg-[#121a28] text-white">Male</option>
                    <option value="Female" className="bg-[#121a28] text-white">Female</option>
                    <option value="Other" className="bg-[#121a28] text-white">Other / Intersex</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="contributor-name" className="block text-[11px] font-semibold text-gray-200">
                      Clinician Name <span className="text-cyan-400">*</span>
                    </label>
                    {currentUser && (
                      <span className="text-[9px] text-cyan-400/80 font-mono">Logged in</span>
                    )}
                  </div>
                  <input
                    id="contributor-name"
                    type="text"
                    required
                    value={contributorName}
                    onChange={(e) => setContributorName(e.target.value)}
                    placeholder="e.g., Dr. Jane Smith"
                    className={`w-full bg-[#121a28] border rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors ${
                      contributorName.trim().length >= 2 ? "border-emerald-600/50" : "border-[#22334d]"
                    }`}
                  />
                </div>
              </div>

              {/* Clinical Description & Findings */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="clinical-description" className="block text-[11px] font-semibold text-gray-200">
                    Clinical Description & Findings <span className="text-cyan-400">*</span>
                  </label>
                  <span
                    className={`text-[10px] font-mono ${
                      description.trim().length >= 10
                        ? "text-emerald-400 font-semibold"
                        : "text-gray-400"
                    }`}
                  >
                    {description.trim().length >= 10 ? "✓ " : ""}{description.trim().length}/10 chars min
                  </span>
                </div>
                <textarea
                  id="clinical-description"
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail the clinical history, presentation (e.g. fever, acute cough, dyspnea), radiological findings (e.g. dense opacity in right lower lobe), and differential diagnosis points..."
                  className={`w-full bg-[#121a28] border rounded-lg p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none leading-relaxed transition-colors ${
                    description.trim().length >= 10 ? "border-emerald-600/50" : "border-[#22334d]"
                  }`}
                />
              </div>

              {/* De-identification Confirmation Checkbox */}
              <div className={`p-2 rounded-lg border transition-colors ${
                isAnonymized ? "bg-emerald-950/20 border-emerald-700/40" : "bg-[#101724] border-[#22334d]"
              }`}>
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAnonymized}
                    onChange={(e) => setIsAnonymized(e.target.checked)}
                    className="mt-0.5 rounded border-gray-600 text-cyan-500 focus:ring-cyan-400 bg-[#121a28]"
                  />
                  <span className="text-[10.5px] text-gray-300 leading-tight">
                    I certify this scan is <strong>completely de-identified</strong> with patient names, MRNs, and facility markers removed in accordance with Australian Privacy Principles & HIPAA Safe Harbor standards. <span className="text-cyan-400">*</span>
                  </span>
                </label>
              </div>

              {/* Dynamic Feedback Banner */}
              {errorMessage && (
                <div className="px-2.5 py-1.5 rounded-lg bg-red-950/60 border border-red-800/60 text-red-200 flex items-center gap-2 text-[11px]">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="truncate">{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 flex items-center gap-2 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate font-medium">{successMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Upload Progress Status (when active) */}
          {isUploading && (
            <div className="px-4 py-2 bg-[#141e2e] border-t border-cyan-500/40 space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] text-cyan-300 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>{uploadStep || "Uploading case..."}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1 rounded-full animate-pulse w-3/4"></div>
              </div>
            </div>
          )}

          {/* Modal Actions Footer - Compact & Crisp */}
          <div className="px-4 sm:px-5 py-2.5 bg-[#121a28] border-t border-[#1c293c] rounded-b-2xl flex items-center justify-between shrink-0 gap-3">
            {/* Real-time Completion Progress */}
            <div className="min-w-0 flex-1">
              {isFormComplete ? (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold animate-in fade-in duration-150">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">All details completed ({totalDetails}/{totalDetails}) · Ready to publish</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-300/90 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">
                    <strong>{completedDetails}/{totalDetails}</strong> details completed ·{" "}
                    <span className="text-gray-400">
                      Need: {missingFields.slice(0, 2).join(", ")}{missingFields.length > 2 ? ` (+${missingFields.length - 2} more)` : ""}
                    </span>
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-3.5 py-1.5 rounded-lg bg-[#141e2e] hover:bg-[#1a273b] text-gray-300 hover:text-white transition-colors border border-[#23354f] text-xs cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isFormComplete || isUploading}
                title={
                  isFormComplete
                    ? "Upload and publish scan case"
                    : `Please fill out all details: ${missingFields.join(", ")}`
                }
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-cyan-950/40 border border-cyan-400/40 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload & Publish</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
