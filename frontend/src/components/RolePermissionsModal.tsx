"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Shield,
  ShieldCheck,
  Check,
  X,
  Search,
  RotateCcw,
  Save,
  Users,
  Plus,
  Mail,
  GraduationCap,
  UserCheck,
  DollarSign,
  MessageSquare,
  Sliders,
  Grid,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  Layers,
  KeyRound,
} from "lucide-react";
import {
  RoleDefinition,
  PermissionItem,
  SuperAdminCredential,
  BASELINE_ROLES,
  PERMISSION_CATALOG,
  PERMISSION_CATEGORIES,
  loadRoleDefinitions,
  saveRoleDefinition,
  saveAllRoleDefinitions,
  assignEmailToRole,
  removeEmailFromRole,
  loadSuperAdminCredentials,
  registerSuperAdmin,
  isUserSuperAdmin,
} from "@/lib/rbac";
import { UserProfile, firebaseConfig } from "@/lib/firebase";

interface RolePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onRolesUpdated?: (roles: RoleDefinition[]) => void;
}

export default function RolePermissionsModal({
  isOpen,
  onClose,
  currentUser,
  onRolesUpdated,
}: RolePermissionsModalProps) {
  const [roles, setRoles] = useState<RoleDefinition[]>(BASELINE_ROLES);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("accounting");
  const [viewMode, setViewMode] = useState<"editor" | "matrix" | "superadmins">("editor");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [permissionSearch, setPermissionSearch] = useState<string>("");
  const [newEmail, setNewEmail] = useState<string>("");
  const [superadmins, setSuperadmins] = useState<SuperAdminCredential[]>([]);
  const [newSuperAdminEmail, setNewSuperAdminEmail] = useState<string>("");
  const [newSuperAdminName, setNewSuperAdminName] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Load roles & superadmins from Firebase Firestore & local storage
  useEffect(() => {
    if (!isOpen) return;
    async function loadData() {
      setIsLoading(true);
      try {
        const [loadedRoles, loadedSuperAdmins] = await Promise.all([
          loadRoleDefinitions(),
          loadSuperAdminCredentials(),
        ]);
        setRoles(loadedRoles);
        setSuperadmins(loadedSuperAdmins);
      } catch (err) {
        console.error("Failed to load RBAC data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [isOpen]);

  const activeRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || roles[0];
  }, [roles, selectedRoleId]);

  const isCurrentSuperAdmin = useMemo(() => {
    return isUserSuperAdmin(currentUser?.email, currentUser?.role);
  }, [currentUser]);

  // Filter permissions based on category and search query
  const filteredPermissions = useMemo(() => {
    return PERMISSION_CATALOG.filter((perm) => {
      const matchesCategory =
        selectedCategory === "all" || perm.category === selectedCategory;
      const matchesSearch =
        !permissionSearch.trim() ||
        perm.name.toLowerCase().includes(permissionSearch.toLowerCase()) ||
        perm.slug.toLowerCase().includes(permissionSearch.toLowerCase()) ||
        perm.description.toLowerCase().includes(permissionSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, permissionSearch]);

  // Counts for category tabs in the active role
  const categoryCounts = useMemo(() => {
    const counts: Record<string, { active: number; total: number }> = {
      all: { active: activeRole.permissions.length, total: PERMISSION_CATALOG.length },
    };

    PERMISSION_CATEGORIES.forEach((cat) => {
      if (cat.id === "all") return;
      const catPerms = PERMISSION_CATALOG.filter((p) => p.category === cat.id);
      const activeInCat = catPerms.filter((p) =>
        activeRole.permissions.includes(p.slug)
      ).length;
      counts[cat.id] = { active: activeInCat, total: catPerms.length };
    });

    return counts;
  }, [activeRole]);

  // Toggle single permission for the active role
  const handleTogglePermission = (slug: string) => {
    if (activeRole.id === "superadmin") {
      setFeedbackMessage({
        type: "info",
        text: "Superadmins unconditionally possess all 24 permissions.",
      });
      return;
    }

    setRoles((prev) =>
      prev.map((role) => {
        if (role.id !== activeRole.id) return role;
        const exists = role.permissions.includes(slug);
        const newPerms = exists
          ? role.permissions.filter((p) => p !== slug)
          : [...role.permissions, slug];
        return {
          ...role,
          permissions: newPerms,
          isCustomized: true,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Quick action: Tick all currently shown permissions
  const handleTickShown = () => {
    if (activeRole.id === "superadmin") return;
    const slugsToAdd = filteredPermissions.map((p) => p.slug);
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id !== activeRole.id) return role;
        const set = new Set([...role.permissions, ...slugsToAdd]);
        return {
          ...role,
          permissions: Array.from(set),
          isCustomized: true,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Quick action: Clear all currently shown permissions
  const handleClearShown = () => {
    if (activeRole.id === "superadmin") return;
    const slugsToRemove = new Set(filteredPermissions.map((p) => p.slug));
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id !== activeRole.id) return role;
        return {
          ...role,
          permissions: role.permissions.filter((p) => !slugsToRemove.has(p)),
          isCustomized: true,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Reset active role to baseline default
  const handleResetBaseline = () => {
    const base = BASELINE_ROLES.find((b) => b.id === activeRole.id);
    if (!base) return;

    setRoles((prev) =>
      prev.map((role) => {
        if (role.id !== activeRole.id) return role;
        return {
          ...role,
          permissions: [...base.baselinePermissions],
          isCustomized: false,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    setFeedbackMessage({
      type: "info",
      text: `Role "${activeRole.name}" reset to baseline default (${base.baselinePermissions.length} permissions).`,
    });
  };

  // Save active role to Firebase Firestore
  const handleSaveActiveRole = async () => {
    setIsSaving(true);
    setFeedbackMessage(null);
    try {
      await saveRoleDefinition(activeRole);
      onRolesUpdated?.(roles);
      setFeedbackMessage({
        type: "success",
        text: `Role "${activeRole.name}" permissions saved to Firebase Firestore!`,
      });
    } catch (err: any) {
      setFeedbackMessage({
        type: "error",
        text: err.message || "Failed to save role to Firebase.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Save all 11 roles to Firebase Firestore
  const handleSaveAllRoles = async () => {
    setIsSaving(true);
    setFeedbackMessage(null);
    try {
      await saveAllRoleDefinitions(roles);
      onRolesUpdated?.(roles);
      setFeedbackMessage({
        type: "success",
        text: "All 11 system role permissions saved to Firebase Firestore successfully!",
      });
    } catch (err: any) {
      setFeedbackMessage({
        type: "error",
        text: err.message || "Failed to save all roles to Firebase.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Add Google email address to active role
  const handleAddEmailToRole = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newEmail.toLowerCase().trim();
    if (!clean || !clean.includes("@")) {
      setFeedbackMessage({
        type: "error",
        text: "Please enter a valid Google email address.",
      });
      return;
    }

    try {
      const updated = await assignEmailToRole(clean, activeRole.id);
      setRoles(updated);
      setNewEmail("");
      onRolesUpdated?.(updated);
      setFeedbackMessage({
        type: "success",
        text: `${clean} is now assigned to the ${activeRole.name} role in Firebase!`,
      });
    } catch (err: any) {
      setFeedbackMessage({
        type: "error",
        text: err.message || "Failed to assign role.",
      });
    }
  };

  // Remove email from active role
  const handleRemoveEmailFromRole = async (email: string) => {
    try {
      const updated = await removeEmailFromRole(email, activeRole.id);
      setRoles(updated);
      onRolesUpdated?.(updated);
      setFeedbackMessage({
        type: "info",
        text: `Removed ${email} from ${activeRole.name}.`,
      });
    } catch (err: any) {
      setFeedbackMessage({
        type: "error",
        text: err.message || "Failed to remove user.",
      });
    }
  };

  // Add a new SuperAdmin credential in Firebase
  const handleAddSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSuperAdminEmail.toLowerCase().trim();
    if (!clean || !clean.includes("@")) return;

    try {
      const updatedList = await registerSuperAdmin(
        clean,
        newSuperAdminName || clean.split("@")[0],
        "Designated SuperAdmin in Firebase"
      );
      setSuperadmins(updatedList);
      setNewSuperAdminEmail("");
      setNewSuperAdminName("");
      setFeedbackMessage({
        type: "success",
        text: `SuperAdmin credentials stored in Firebase for ${clean}.`,
      });
    } catch (err: any) {
      setFeedbackMessage({
        type: "error",
        text: err.message || "Failed to register SuperAdmin.",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl max-h-[92vh] bg-[#0c0d16] border border-purple-900/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-xs text-gray-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ============================================================ */}
        {/* HEADER: SUPERADMIN RBAC ENGINE (Matching Attached Screenshot) */}
        {/* ============================================================ */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-[#240c4f] via-[#2d0f5e] to-[#1a0a38] border-b border-purple-800/40 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-800/40 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pr-8">
            <div className="space-y-2">
              {/* Badges Row */}
              <div className="flex items-center flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-950/80 border border-purple-500/50 text-[10px] sm:text-xs font-bold text-purple-200 tracking-wide uppercase">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  SUPERADMIN RBAC ENGINE
                </span>
                <span className="px-2.5 py-1 rounded-full bg-purple-900/40 border border-purple-700/40 text-[10.5px] font-medium text-purple-300">
                  11 system roles
                </span>
                <span className="px-2.5 py-1 rounded-full bg-purple-900/40 border border-purple-700/40 text-[10.5px] font-medium text-purple-300">
                  24 granular permissions
                </span>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                Role Permissions Management
              </h1>
              <p className="text-xs sm:text-sm text-purple-200/80 max-w-2xl leading-relaxed">
                Grant or revoke what each system role may do. Saved changes reach signed-in users straight away, and the Firestore security rules check the same lists.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-purple-300/70 pt-0.5">
                <span className="w-4 h-4 rounded-full border border-purple-400/50 flex items-center justify-center text-[10px] text-purple-300 font-serif">
                  i
                </span>
                <span>
                  All newly registered users receive the <strong className="text-white">supporter</strong> role by default.
                </span>
              </div>
            </div>

            {/* Right Actions: Mode Toggle & Save All Button */}
            <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-2.5 shrink-0 self-start mt-1">
              {/* Mode Toggle Button Group */}
              <div className="inline-flex rounded-xl bg-purple-950/70 p-1 border border-purple-800/60 shadow-inner">
                <button
                  type="button"
                  onClick={() => setViewMode("editor")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === "editor"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-950/60"
                      : "text-purple-300 hover:text-white hover:bg-purple-900/40"
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Role-by-Role Editor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("matrix")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === "matrix"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-950/60"
                      : "text-purple-300 hover:text-white hover:bg-purple-900/40"
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Full Matrix Comparison</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("superadmins")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === "superadmins"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-950/60"
                      : "text-purple-300 hover:text-white hover:bg-purple-900/40"
                  }`}
                  title="View Firebase SuperAdmin Credentials"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Firebase SuperAdmins</span>
                </button>
              </div>

              {/* Save All Role Permissions [11] */}
              <button
                type="button"
                onClick={handleSaveAllRoles}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.99] text-white font-bold text-xs shadow-lg shadow-purple-950/50 border border-purple-400/40 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save All Role Permissions ({roles.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Alert Bar */}
        {feedbackMessage && (
          <div
            className={`px-4 py-2 flex items-center justify-between text-xs font-medium border-b animate-in fade-in duration-150 ${
              feedbackMessage.type === "success"
                ? "bg-emerald-950/80 border-emerald-800 text-emerald-200"
                : feedbackMessage.type === "error"
                ? "bg-red-950/80 border-red-800 text-red-200"
                : "bg-purple-950/80 border-purple-800 text-purple-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMessage.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {feedbackMessage.type === "error" && <AlertCircle className="w-4 h-4 text-red-400" />}
              {feedbackMessage.type === "info" && <Sparkles className="w-4 h-4 text-purple-400" />}
              <span>{feedbackMessage.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-xs hover:opacity-75 p-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* ROLE SELECTION BAR (11 ROLES MATCHING SCREENSHOT)            */}
        {/* ============================================================ */}
        <div className="p-3 sm:p-4 bg-[#111322] border-b border-[#21243d]">
          <span className="block text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-2">
            SELECT ROLE TO CONFIGURE PERMISSIONS
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {roles.map((role) => {
              const isSelected = role.id === selectedRoleId;
              const permCount = role.id === "superadmin" ? "ALL" : role.permissions.length;

              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-900/40"
                      : "bg-[#181a2e] text-gray-300 hover:text-white hover:bg-[#20233d] border-[#292d4d]"
                  }`}
                >
                  <span>{role.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSelected
                        ? "bg-purple-950 text-purple-200"
                        : "bg-[#252844] text-gray-300"
                    }`}
                  >
                    {permCount}
                  </span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected
                        ? "bg-purple-300"
                        : role.permissions.length > 0
                        ? "bg-amber-400"
                        : "bg-gray-500"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================ */}
        {/* MAIN BODY: ROLE-BY-ROLE EDITOR OR FULL MATRIX OR SUPERADMINS */}
        {/* ============================================================ */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          {viewMode === "editor" && (
            <>
              {/* 1. USER ASSIGNMENT PANEL: "People with the [Role] role" */}
              <div className="rounded-xl bg-[#131627] border border-[#232742] p-3.5 sm:p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs sm:text-sm font-bold text-white">
                    People with the {activeRole.name} role ({activeRole.assignedEmails.length})
                  </h3>
                </div>
                <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
                  Add a Google email address to give that account this role. It applies the next time they sign in, or straight away if they are signed in. Someone who has another role moves to this one.
                </p>

                <form onSubmit={handleAddEmailToRole} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-[#0d0f1b] border border-[#252a48] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to {activeRole.name}</span>
                  </button>
                </form>

                {/* List of Assigned Emails */}
                <div className="mt-3">
                  {activeRole.assignedEmails.length === 0 ? (
                    <p className="text-[11px] text-gray-500 italic">
                      No email addresses have this role yet.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {activeRole.assignedEmails.map((email) => (
                        <span
                          key={email}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1a1e35] border border-purple-800/40 text-[11px] text-purple-200 font-mono"
                        >
                          <span>{email}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveEmailFromRole(email)}
                            className="text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Remove role"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. ACTIVE ROLE CONFIGURATION CARD */}
              <div className="rounded-xl bg-[#131627] border border-[#232742] p-3.5 sm:p-5 space-y-4">
                {/* Role Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#21253f] pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-lg bg-purple-600 text-white font-bold text-xs tracking-wide">
                      {activeRole.name}
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono">
                      Level {activeRole.level}
                    </span>
                    <span className="text-xs font-bold text-purple-400">
                      {activeRole.id === "superadmin"
                        ? "ALL (24/24) permissions"
                        : `${activeRole.permissions.length}/${PERMISSION_CATALOG.length} permissions`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeRole.id !== "superadmin" && (
                      <button
                        type="button"
                        onClick={handleResetBaseline}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181c30] hover:bg-[#202540] text-gray-300 hover:text-white border border-[#282d4c] text-xs font-medium transition-colors cursor-pointer"
                        title="Reset this role to standard baseline"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Baseline</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveActiveRole}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Role</span>
                    </button>
                  </div>
                </div>

                {/* Role Description */}
                <p className="text-[11.5px] text-gray-400 leading-relaxed">
                  {activeRole.description}
                </p>

                {/* Category Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  {PERMISSION_CATEGORIES.map((cat) => {
                    const isTabActive = selectedCategory === cat.id;
                    const count = categoryCounts[cat.id] || { active: 0, total: 0 };

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                          isTabActive
                            ? "bg-purple-600 text-white border-purple-500 shadow-sm"
                            : "bg-[#181b30] text-gray-400 hover:text-gray-200 border-[#242948]"
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span className="font-mono text-[10px] opacity-80">
                          {count.active}/{count.total}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Quick Actions & Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTickShown}
                      disabled={activeRole.id === "superadmin"}
                      className="px-2.5 py-1 rounded bg-[#181c30] hover:bg-[#202540] text-gray-300 hover:text-white border border-[#282d4c] text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-40"
                    >
                      Tick shown
                    </button>
                    <button
                      type="button"
                      onClick={handleClearShown}
                      disabled={activeRole.id === "superadmin"}
                      className="px-2.5 py-1 rounded bg-[#181c30] hover:bg-[#202540] text-gray-300 hover:text-white border border-[#282d4c] text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-40"
                    >
                      Clear shown
                    </button>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={permissionSearch}
                      onChange={(e) => setPermissionSearch(e.target.value)}
                      placeholder="Filter permissions..."
                      className="w-full bg-[#0d0f1b] border border-[#252a48] rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* 3-COLUMN PERMISSIONS GRID (MATCHING ATTACHED SCREENSHOT) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  {filteredPermissions.map((perm) => {
                    const isGranted =
                      activeRole.id === "superadmin" ||
                      activeRole.permissions.includes(perm.slug);

                    return (
                      <div
                        key={perm.slug}
                        onClick={() => handleTogglePermission(perm.slug)}
                        className={`rounded-xl border p-3 flex flex-col justify-between transition-all cursor-pointer ${
                          isGranted
                            ? "bg-[#181533] border-purple-500/60 shadow-md shadow-purple-950/30 ring-1 ring-purple-500/20"
                            : "bg-[#0e101c] border-[#222644] hover:border-[#2e335b] opacity-80 hover:opacity-100"
                        }`}
                      >
                        {/* Top: Checkbox, Name, Slug Pill */}
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={isGranted}
                            readOnly
                            disabled={activeRole.id === "superadmin"}
                            className="mt-0.5 rounded border-gray-600 text-purple-600 focus:ring-purple-500 bg-[#0c0d16] cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <h4
                                className={`text-[11.5px] font-bold leading-snug ${
                                  isGranted ? "text-white" : "text-gray-300"
                                }`}
                              >
                                {perm.name}
                              </h4>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#13162b] text-gray-400 border border-[#24284b] shrink-0">
                                {perm.slug}
                              </span>
                            </div>
                            <p className="text-[10.5px] text-gray-400 leading-relaxed">
                              {perm.description}
                            </p>
                          </div>
                        </div>

                        {/* Bottom: Category Label */}
                        <div className="mt-3 pt-2 border-t border-[#1b1f38] flex items-center gap-1.5 text-[9.5px] text-purple-400">
                          {perm.category === "academic" && <GraduationCap className="w-3 h-3" />}
                          {perm.category === "admissions" && <UserCheck className="w-3 h-3" />}
                          {perm.category === "finance" && <DollarSign className="w-3 h-3" />}
                          {perm.category === "communications" && <MessageSquare className="w-3 h-3" />}
                          {perm.category === "governance" && <Shield className="w-3 h-3" />}
                          <span className="font-medium text-purple-300/80">{perm.categoryLabel}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* VIEW MODE: FULL MATRIX COMPARISON                            */}
          {/* ============================================================ */}
          {viewMode === "matrix" && (
            <div className="rounded-xl bg-[#131627] border border-[#232742] p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Grid className="w-4 h-4 text-purple-400" />
                    Full Role Permissions Matrix
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Compare granted permissions across all 11 system roles simultaneously. Click any cell to toggle.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveAllRoles}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save All Changes</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-[#21243f] rounded-lg">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-[#181a30] border-b border-[#24284a] text-gray-300">
                      <th className="p-2.5 font-bold sticky left-0 bg-[#181a30] z-20 min-w-[200px]">
                        Permission ({PERMISSION_CATALOG.length})
                      </th>
                      {roles.map((r) => (
                        <th
                          key={r.id}
                          className="p-2 text-center font-bold font-mono text-[10px] min-w-[85px]"
                        >
                          <span className="block truncate">{r.name}</span>
                          <span className="text-[9px] text-purple-400 font-normal">
                            {r.id === "superadmin" ? "ALL" : `${r.permissions.length}/24`}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1c1f38]">
                    {PERMISSION_CATALOG.map((perm) => (
                      <tr key={perm.slug} className="hover:bg-[#16192d] transition-colors">
                        <td className="p-2 sticky left-0 bg-[#131627] z-10">
                          <span className="font-semibold text-white block text-[11px]">
                            {perm.name}
                          </span>
                          <span className="text-[9.5px] text-gray-400 font-mono">
                            {perm.slug} · {perm.categoryLabel}
                          </span>
                        </td>
                        {roles.map((r) => {
                          const isAllowed =
                            r.id === "superadmin" || r.permissions.includes(perm.slug);

                          return (
                            <td
                              key={r.id}
                              onClick={() => {
                                if (r.id === "superadmin") return;
                                setRoles((prev) =>
                                  prev.map((item) => {
                                    if (item.id !== r.id) return item;
                                    const hasIt = item.permissions.includes(perm.slug);
                                    return {
                                      ...item,
                                      permissions: hasIt
                                        ? item.permissions.filter((p) => p !== perm.slug)
                                        : [...item.permissions, perm.slug],
                                      isCustomized: true,
                                      updatedAt: new Date().toISOString(),
                                    };
                                  })
                                );
                              }}
                              className={`p-2 text-center cursor-pointer transition-colors ${
                                isAllowed
                                  ? "bg-purple-950/30 text-purple-300"
                                  : "text-gray-600 hover:bg-[#1a1e35]"
                              }`}
                            >
                              {isAllowed ? (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-purple-600/40 border border-purple-400/50 text-white font-bold text-[10px]">
                                  ✓
                                </span>
                              ) : (
                                <span className="text-gray-600 text-xs">−</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW MODE: FIREBASE SUPERADMINS                              */}
          {/* ============================================================ */}
          {viewMode === "superadmins" && (
            <div className="rounded-xl bg-[#131627] border border-[#232742] p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <KeyRound className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs sm:text-sm font-bold text-white">
                  Firebase SuperAdmin Credentials
                </h3>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                SuperAdmin credentials are stored securely in Firebase Firestore. Firebase Admins automatically receive SuperAdmin access, granting unconditional authority to execute every administrative function and configure role permissions.
              </p>

              {/* Add New SuperAdmin Form */}
              <form onSubmit={handleAddSuperAdmin} className="p-3.5 rounded-lg bg-[#0e101c] border border-[#232742] space-y-3">
                <span className="block text-[11px] font-bold text-purple-200">
                  Register New SuperAdmin in Firebase
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="email"
                    required
                    value={newSuperAdminEmail}
                    onChange={(e) => setNewSuperAdminEmail(e.target.value)}
                    placeholder="SuperAdmin Google Email (e.g. admin@hospital.org)"
                    className="w-full bg-[#131627] border border-[#252a48] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                  <input
                    type="text"
                    value={newSuperAdminName}
                    onChange={(e) => setNewSuperAdminName(e.target.value)}
                    placeholder="Full Name (e.g. Dr. Jane Smith, CIO)"
                    className="w-full bg-[#131627] border border-[#252a48] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Store SuperAdmin Credentials in Firebase</span>
                </button>
              </form>

              {/* List of SuperAdmins in Firebase */}
              <div className="space-y-2">
                <span className="block text-[11px] font-bold text-gray-300">
                  Verified SuperAdmins in Firebase ({superadmins.length}):
                </span>
                <div className="divide-y divide-[#1f223a] border border-[#22253f] rounded-xl overflow-hidden">
                  {superadmins.map((sa) => (
                    <div
                      key={sa.email}
                      className="p-3 bg-[#101222] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-purple-900/60 border border-purple-500/50 flex items-center justify-center text-purple-300 font-bold text-xs shrink-0">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-white block truncate">
                            {sa.fullName || sa.email.split("@")[0]}
                          </span>
                          <span className="text-[10.5px] text-gray-400 font-mono block truncate">
                            {sa.email}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700/60 font-mono text-[10px]">
                          SuperAdmin
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-mono text-[10px]">
                          ALL 24 PERMS
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 bg-[#0d0f1b] border-t border-[#1c1f35] flex items-center justify-between text-xs text-gray-400">
          <span className="hidden sm:inline-block">
            Connected to Firebase Project: <code className="text-purple-300">{firebaseConfig.projectId}</code>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto px-4 py-1.5 rounded-lg bg-[#16182c] hover:bg-[#20233d] text-gray-300 hover:text-white border border-[#282d4c] text-xs font-semibold transition-colors cursor-pointer"
          >
            Close RBAC Engine
          </button>
        </div>
      </div>
    </div>
  );
}
