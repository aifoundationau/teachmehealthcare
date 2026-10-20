// TeachMeHealthcare RBAC Engine
// 11 System Roles & 24 Granular Permissions
// Direct persistence to Firebase Firestore & local synchronization

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { firestoreDb, firebaseConfig } from "./firebase";
import { readStorage, writeStorage } from "./storage";

export interface PermissionItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: "academic" | "admissions" | "finance" | "communications" | "governance";
  categoryLabel: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  level: number;
  badge: string;
  description: string;
  baselinePermissions: string[];
  permissions: string[];
  assignedEmails: string[];
  updatedAt?: string;
  isCustomized?: boolean;
}

export interface SuperAdminCredential {
  email: string;
  fullName: string;
  role: "superadmin";
  firebaseUid?: string;
  isSuperAdmin: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const PERMISSION_CATEGORIES = [
  { id: "all", label: "All", icon: "Layers" },
  { id: "academic", label: "Academic & LMS", icon: "GraduationCap" },
  { id: "admissions", label: "Admissions & Students", icon: "UserCheck" },
  { id: "finance", label: "Finance & Operations", icon: "DollarSign" },
  { id: "communications", label: "Communications & AI", icon: "MessageSquare" },
  { id: "governance", label: "Administration & Governance", icon: "ShieldCheck" },
] as const;

export const PERMISSION_CATALOG: PermissionItem[] = [
  // Academic & LMS (6 permissions)
  {
    id: "courses.view",
    slug: "courses.view",
    name: "View Courses & Units",
    description: "Inspect full course syllabus, accreditation details, unit structures, and learning outcomes.",
    category: "academic",
    categoryLabel: "Academic & LMS",
  },
  {
    id: "courses.create",
    slug: "courses.create",
    name: "Create & Edit Courses",
    description: "Build new courses and units in LMS Course Builder, add modules and learning outcomes.",
    category: "academic",
    categoryLabel: "Academic & LMS",
  },
  {
    id: "courses.publish",
    slug: "courses.publish",
    name: "Publish Courses to Catalog",
    description: "Publish draft courses to the live public university catalog and admissions portal.",
    category: "academic",
    categoryLabel: "Academic & LMS",
  },
  {
    id: "grades.view",
    slug: "grades.view",
    name: "View Student Grades & Transcripts",
    description: "Access academic performance, assessment results, GPA, and student transcripts.",
    category: "academic",
    categoryLabel: "Academic & LMS",
  },
  {
    id: "grades.edit",
    slug: "grades.edit",
    name: "Grade Assessments & Units",
    description: "Enter scores, mark assignments, and record student competency evaluations.",
    category: "academic",
    categoryLabel: "Academic & LMS",
  },
  {
    id: "classroom.manage",
    slug: "classroom.manage",
    name: "Manage Google Classroom",
    description: "Synchronize rosters, invite teachers/students, and link Google Classroom coursework.",
    category: "academic",
    categoryLabel: "Academic & LMS",
  },

  // Admissions & Students (4 permissions)
  {
    id: "applications.view",
    slug: "applications.view",
    name: "View Applications",
    description: "Read submitted student applications, declarations, and attached documents.",
    category: "admissions",
    categoryLabel: "Admissions & Students",
  },
  {
    id: "applications.review",
    slug: "applications.review",
    name: "Review & Decide Applications",
    description: "Approve, place on hold, or reject prospective student admissions applications.",
    category: "admissions",
    categoryLabel: "Admissions & Students",
  },
  {
    id: "applications.export",
    slug: "applications.export",
    name: "Export Application Records",
    description: "Download full JSON and document dossiers for admissions board audits.",
    category: "admissions",
    categoryLabel: "Admissions & Students",
  },
  {
    id: "students.manage",
    slug: "students.manage",
    name: "Manage Student Identifiers",
    description: "Issue official Student Numbers (STU-2026-XXXXX) and manage student profiles.",
    category: "admissions",
    categoryLabel: "Admissions & Students",
  },

  // Finance & Operations (5 permissions)
  {
    id: "finance.view",
    slug: "finance.view",
    name: "View Financial Ledgers",
    description: "Monitor tuition revenue, fee status, departmental budgets, and balance sheets.",
    category: "finance",
    categoryLabel: "Finance & Operations",
  },
  {
    id: "finance.approve",
    slug: "finance.approve",
    name: "Approve Budgets & Waivers",
    description: "Approve capital expenditures, tuition discounts, scholarship waivers, and refunds.",
    category: "finance",
    categoryLabel: "Finance & Operations",
  },
  {
    id: "tokens.manage",
    slug: "tokens.manage",
    name: "Emergency Fund & Tokens",
    description: "Authorize and disburse student emergency food, housing, and transit tokens.",
    category: "finance",
    categoryLabel: "Finance & Operations",
  },
  {
    id: "events.manage",
    slug: "events.manage",
    name: "Manage Events & RSVPs",
    description: "Schedule campus open days, academic orientations, webinars, and track registrations.",
    category: "finance",
    categoryLabel: "Finance & Operations",
  },
  {
    id: "calendar.manage",
    slug: "calendar.manage",
    name: "Administer Campus Calendar",
    description: "Manage institutional timetable, room bookings, examinations, and term dates.",
    category: "finance",
    categoryLabel: "Finance & Operations",
  },

  // Communications & AI (4 permissions)
  {
    id: "ai.customize",
    slug: "ai.customize",
    name: "Configure AI Knowledge & Tools",
    description: "Tune AI Advisor system guidelines, FAQ ground truth, tools, and response boundaries.",
    category: "communications",
    categoryLabel: "Communications & AI",
  },
  {
    id: "faqs.edit",
    slug: "faqs.edit",
    name: "Manage FAQs & Knowledge Base",
    description: "Create and update university Q&A, safety protocols, and student guidance articles.",
    category: "communications",
    categoryLabel: "Communications & AI",
  },
  {
    id: "messaging.staff",
    slug: "messaging.staff",
    name: "Staff Communications Channel",
    description: "Access real-time internal staff messaging channels and institutional announcements.",
    category: "communications",
    categoryLabel: "Communications & AI",
  },
  {
    id: "telemetry.view",
    slug: "telemetry.view",
    name: "View Telemetry & Analytics",
    description: "Inspect Firebase telemetry events, error monitoring, and page conversion graphs.",
    category: "communications",
    categoryLabel: "Communications & AI",
  },

  // Administration & Governance (5 permissions)
  {
    id: "users.manage",
    slug: "users.manage",
    name: "Manage User Profiles & Roles",
    description: "Assign system roles, audit account logins, and manage staff credentials.",
    category: "governance",
    categoryLabel: "Administration & Governance",
  },
  {
    id: "roles.manage",
    slug: "roles.manage",
    name: "Configure Role Permissions",
    description: "Grant and revoke specific permissions for each of the 11 system roles.",
    category: "governance",
    categoryLabel: "Administration & Governance",
  },
  {
    id: "sheets.sync",
    slug: "sheets.sync",
    name: "Google Sheets 24/7 Sync",
    description: "Trigger bidirectional real-time data sync with Google Sheets master database.",
    category: "governance",
    categoryLabel: "Administration & Governance",
  },
  {
    id: "api_keys.manage",
    slug: "api_keys.manage",
    name: "Manage API Keys & Integrations",
    description: "Configure Gemini API keys, Firebase service accounts, and external credentials.",
    category: "governance",
    categoryLabel: "Administration & Governance",
  },
  {
    id: "campus_metrics.manage",
    slug: "campus_metrics.manage",
    name: "Manage Front Page Campus Metrics",
    description: "Adjust front page headline statistics (Total Students, Employment Placement Rate, Total Faculty & Admin Staff).",
    category: "governance",
    categoryLabel: "Administration & Governance",
  },
];

// All 24 permission slugs array
export const ALL_PERMISSION_SLUGS = PERMISSION_CATALOG.map((p) => p.slug);

// 11 System Roles baseline configuration
export const BASELINE_ROLES: RoleDefinition[] = [
  {
    id: "superadmin",
    name: "Superadmin",
    level: 100,
    badge: "ALL",
    description:
      "Full administrative authority. Superadmins possess every system permission unconditionally and oversee all campus governance, staff assignments, and security rules.",
    baselinePermissions: [...ALL_PERMISSION_SLUGS],
    permissions: [...ALL_PERMISSION_SLUGS],
    assignedEmails: [
      "firebase-adminsdk-fbsvc@ai-foundation-firebase.iam.gserviceaccount.com",
      "superadmin@teachmehealthcare.org",
      "admin@teachmehealthcare.org",
    ],
  },
  {
    id: "chancellor",
    name: "Chancellor",
    level: 90,
    badge: "8",
    description:
      "Highest executive campus authority. Final arbiter on accreditation, governance, faculty chairs, and strategic university initiatives.",
    baselinePermissions: [
      "courses.view",
      "courses.publish",
      "finance.view",
      "finance.approve",
      "messaging.staff",
      "telemetry.view",
      "users.manage",
      "campus_metrics.manage",
    ],
    permissions: [
      "courses.view",
      "courses.publish",
      "finance.view",
      "finance.approve",
      "messaging.staff",
      "telemetry.view",
      "users.manage",
      "campus_metrics.manage",
    ],
    assignedEmails: [],
  },
  {
    id: "president",
    name: "President",
    level: 85,
    badge: "11",
    description:
      "Executive leadership over campus academic operations, budget distribution, and external partnerships.",
    baselinePermissions: [
      "courses.view",
      "courses.create",
      "courses.publish",
      "applications.view",
      "applications.review",
      "finance.view",
      "finance.approve",
      "messaging.staff",
      "telemetry.view",
      "users.manage",
      "campus_metrics.manage",
    ],
    permissions: [
      "courses.view",
      "courses.create",
      "courses.publish",
      "applications.view",
      "applications.review",
      "finance.view",
      "finance.approve",
      "messaging.staff",
      "telemetry.view",
      "users.manage",
      "campus_metrics.manage",
    ],
    assignedEmails: [],
  },
  {
    id: "ceo",
    name: "CEO",
    level: 80,
    badge: "9",
    description:
      "Chief executive officer steering educational programs, organizational scaling, and institutional growth.",
    baselinePermissions: [
      "courses.view",
      "courses.publish",
      "applications.view",
      "finance.view",
      "finance.approve",
      "events.manage",
      "messaging.staff",
      "telemetry.view",
      "campus_metrics.manage",
    ],
    permissions: [
      "courses.view",
      "courses.publish",
      "applications.view",
      "finance.view",
      "finance.approve",
      "events.manage",
      "messaging.staff",
      "telemetry.view",
      "campus_metrics.manage",
    ],
    assignedEmails: [],
  },
  {
    id: "coo",
    name: "COO",
    level: 75,
    badge: "7",
    description:
      "Chief operations officer directing daily operational logistics, event facilities, and calendar management.",
    baselinePermissions: [
      "courses.view",
      "events.manage",
      "calendar.manage",
      "messaging.staff",
      "telemetry.view",
      "users.manage",
      "sheets.sync",
    ],
    permissions: [
      "courses.view",
      "events.manage",
      "calendar.manage",
      "messaging.staff",
      "telemetry.view",
      "users.manage",
      "sheets.sync",
    ],
    assignedEmails: [],
  },
  {
    id: "cfo",
    name: "CFO",
    level: 70,
    badge: "6",
    description:
      "Chief financial officer managing institutional capital, ledger audits, fee policies, and fiscal compliance.",
    baselinePermissions: [
      "finance.view",
      "finance.approve",
      "tokens.manage",
      "messaging.staff",
      "telemetry.view",
      "sheets.sync",
    ],
    permissions: [
      "finance.view",
      "finance.approve",
      "tokens.manage",
      "messaging.staff",
      "telemetry.view",
      "sheets.sync",
    ],
    assignedEmails: [],
  },
  {
    id: "accounting",
    name: "Accounting",
    level: 60,
    badge: "5",
    description:
      "Day-to-day finance: ledgers, approvals and emergency tokens. Not in Firestore yet: showing the baseline. Saving creates roles/accounting.",
    baselinePermissions: [
      "applications.view",
      "finance.view",
      "finance.approve",
      "tokens.manage",
      "messaging.staff",
    ],
    permissions: [
      "applications.view",
      "finance.view",
      "finance.approve",
      "tokens.manage",
      "messaging.staff",
    ],
    assignedEmails: [],
  },
  {
    id: "administration",
    name: "Administration",
    level: 50,
    badge: "12",
    description:
      "Campus administration and registrar services: student applications, user provisioning, scheduling, and metrics.",
    baselinePermissions: [
      "courses.view",
      "applications.view",
      "applications.review",
      "applications.export",
      "students.manage",
      "events.manage",
      "calendar.manage",
      "messaging.staff",
      "users.manage",
      "roles.manage",
      "sheets.sync",
      "campus_metrics.manage",
    ],
    permissions: [
      "courses.view",
      "applications.view",
      "applications.review",
      "applications.export",
      "students.manage",
      "events.manage",
      "calendar.manage",
      "messaging.staff",
      "users.manage",
      "roles.manage",
      "sheets.sync",
      "campus_metrics.manage",
    ],
    assignedEmails: [],
  },
  {
    id: "teacher",
    name: "Teacher",
    level: 40,
    badge: "8",
    description:
      "Faculty instructors and clinical educators: course builder, assessment marking, grades, and classroom sync.",
    baselinePermissions: [
      "courses.view",
      "courses.create",
      "grades.view",
      "grades.edit",
      "classroom.manage",
      "faqs.edit",
      "messaging.staff",
      "calendar.manage",
    ],
    permissions: [
      "courses.view",
      "courses.create",
      "grades.view",
      "grades.edit",
      "classroom.manage",
      "faqs.edit",
      "messaging.staff",
      "calendar.manage",
    ],
    assignedEmails: [],
  },
  {
    id: "student",
    name: "Student",
    level: 20,
    badge: "3",
    description:
      "Enrolled medical scholars: access course syllabus, submit assessments, view personal grades, and emergency tokens.",
    baselinePermissions: ["courses.view", "grades.view", "tokens.manage"],
    permissions: ["courses.view", "grades.view", "tokens.manage"],
    assignedEmails: [],
  },
  {
    id: "supporter",
    name: "Supporter",
    level: 10,
    badge: "1",
    description:
      "Community members, prospective students, and healthcare patrons supporting remote learning missions.",
    baselinePermissions: ["courses.view"],
    permissions: ["courses.view"],
    assignedEmails: [],
  },
];

// Known SuperAdmin emails in Firebase
export const DEFAULT_FIREBASE_SUPERADMINS: SuperAdminCredential[] = [
  {
    email: "firebase-adminsdk-fbsvc@ai-foundation-firebase.iam.gserviceaccount.com",
    fullName: "Firebase Service Account Admin",
    role: "superadmin",
    isSuperAdmin: true,
    notes: "Firebase Project Service Account Admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    email: "superadmin@teachmehealthcare.org",
    fullName: "Chief SuperAdmin",
    role: "superadmin",
    isSuperAdmin: true,
    notes: "Executive SuperAdmin Account",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    email: "admin@teachmehealthcare.org",
    fullName: "System SuperAdmin",
    role: "superadmin",
    isSuperAdmin: true,
    notes: "System Governance SuperAdmin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const STORAGE_KEY_ROLES = "tmh_rbac_roles_v2";
const STORAGE_KEY_SUPERADMINS = "tmh_rbac_superadmins_v2";

/**
 * Checks whether an email or role is a SuperAdmin.
 * Firebase Admins are SuperAdmins.
 */
export function isUserSuperAdmin(
  email?: string | null,
  role?: string | null
): boolean {
  if (!email && !role) return false;

  const normalizedRole = (role || "").toLowerCase().trim();
  if (normalizedRole === "superadmin" || normalizedRole === "admin") {
    return true;
  }

  const normalizedEmail = (email || "").toLowerCase().trim();
  if (!normalizedEmail) return false;

  // Check known default SuperAdmin emails
  if (
    DEFAULT_FIREBASE_SUPERADMINS.some(
      (sa) => sa.email.toLowerCase() === normalizedEmail
    )
  ) {
    return true;
  }

  // Check cached SuperAdmins in localStorage
  try {
    const cachedAdminsRaw = readStorage(STORAGE_KEY_SUPERADMINS);
    if (cachedAdminsRaw) {
      const cachedAdmins: SuperAdminCredential[] = JSON.parse(cachedAdminsRaw);
      if (
        cachedAdmins.some((sa) => sa.email.toLowerCase() === normalizedEmail)
      ) {
        return true;
      }
    }
  } catch (e) {
    // ignore
  }

  // Check roles assigned emails for superadmin
  try {
    const cachedRolesRaw = readStorage(STORAGE_KEY_ROLES);
    if (cachedRolesRaw) {
      const cachedRoles: RoleDefinition[] = JSON.parse(cachedRolesRaw);
      const superadminRole = cachedRoles.find((r) => r.id === "superadmin");
      if (
        superadminRole?.assignedEmails.some(
          (e) => e.toLowerCase() === normalizedEmail
        )
      ) {
        return true;
      }
    }
  } catch (e) {
    // ignore
  }

  return false;
}

/**
 * Load all role definitions from Firestore with localStorage fallback
 */
export async function loadRoleDefinitions(): Promise<RoleDefinition[]> {
  // 1. Try local storage cache first for instant render
  let roles: RoleDefinition[] = [...BASELINE_ROLES];
  try {
    const cached = readStorage(STORAGE_KEY_ROLES);
    if (cached) {
      const parsed: RoleDefinition[] = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with baseline roles so no newly added roles are missing
        roles = BASELINE_ROLES.map((base) => {
          const found = parsed.find((p) => p.id === base.id);
          if (!found) return base;
          return {
            ...base,
            permissions: found.permissions || base.permissions,
            assignedEmails: found.assignedEmails || base.assignedEmails,
            updatedAt: found.updatedAt,
            isCustomized: found.isCustomized ?? (found.permissions.length !== base.baselinePermissions.length),
          };
        });
      }
    }
  } catch (e) {
    console.warn("[rbac] Local storage parse note:", e);
  }

  // 2. Fetch fresh documents from Firestore
  try {
    if (firestoreDb) {
      const rolesCol = collection(firestoreDb, "roles");
      const snap = await getDocs(rolesCol);
      if (!snap.empty) {
        const firestoreRolesMap = new Map<string, any>();
        snap.forEach((docSnap) => {
          firestoreRolesMap.set(docSnap.id, docSnap.data());
        });

        roles = roles.map((role) => {
          const docData = firestoreRolesMap.get(role.id);
          if (docData) {
            return {
              ...role,
              permissions: Array.isArray(docData.permissions) ? docData.permissions : role.permissions,
              assignedEmails: Array.isArray(docData.assignedEmails) ? docData.assignedEmails : role.assignedEmails,
              updatedAt: docData.updatedAt || role.updatedAt,
              isCustomized: true,
            };
          }
          return role;
        });

        writeStorage(STORAGE_KEY_ROLES, JSON.stringify(roles));
      }
    }
  } catch (err) {
    console.warn("[rbac] Firestore load note:", err);
  }

  return roles;
}

/**
 * Save a single role configuration to Firebase Firestore and local storage
 */
export async function saveRoleDefinition(role: RoleDefinition): Promise<void> {
  // 1. Save to localStorage immediately
  try {
    const currentRoles = await loadRoleDefinitions();
    const updated = currentRoles.map((r) => (r.id === role.id ? role : r));
    writeStorage(STORAGE_KEY_ROLES, JSON.stringify(updated));
  } catch (e) {
    console.error("[rbac] Local storage save error:", e);
  }

  // 2. Write to Firebase Firestore
  try {
    if (firestoreDb) {
      const roleDocRef = doc(firestoreDb, "roles", role.id);
      await setDoc(
        roleDocRef,
        {
          roleId: role.id,
          name: role.name,
          level: role.level,
          description: role.description,
          permissions: role.permissions,
          assignedEmails: role.assignedEmails,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn("[rbac] Firestore saveRole error:", err);
  }
}

/**
 * Save all role definitions to Firebase Firestore
 */
export async function saveAllRoleDefinitions(
  roles: RoleDefinition[]
): Promise<void> {
  writeStorage(STORAGE_KEY_ROLES, JSON.stringify(roles));

  try {
    if (firestoreDb) {
      for (const role of roles) {
        const roleDocRef = doc(firestoreDb, "roles", role.id);
        await setDoc(
          roleDocRef,
          {
            roleId: role.id,
            name: role.name,
            level: role.level,
            description: role.description,
            permissions: role.permissions,
            assignedEmails: role.assignedEmails,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    }
  } catch (err) {
    console.warn("[rbac] Firestore saveAllRoles error:", err);
  }
}

/**
 * Assign an email to a role:
 * Removes this email from any other role and adds it to the target role.
 */
export async function assignEmailToRole(
  email: string,
  targetRoleId: string
): Promise<RoleDefinition[]> {
  const cleanEmail = email.toLowerCase().trim();
  const currentRoles = await loadRoleDefinitions();

  const updatedRoles = currentRoles.map((role) => {
    // If this is the target role, ensure email is present
    if (role.id === targetRoleId) {
      const exists = role.assignedEmails.some(
        (e) => e.toLowerCase() === cleanEmail
      );
      return {
        ...role,
        assignedEmails: exists
          ? role.assignedEmails
          : [...role.assignedEmails, cleanEmail],
        updatedAt: new Date().toISOString(),
      };
    }
    // Remove email from any other role
    return {
      ...role,
      assignedEmails: role.assignedEmails.filter(
        (e) => e.toLowerCase() !== cleanEmail
      ),
      updatedAt: new Date().toISOString(),
    };
  });

  // Save all updated roles
  await saveAllRoleDefinitions(updatedRoles);

  // If assigned to superadmin, also record in superadmins collection
  if (targetRoleId === "superadmin") {
    await registerSuperAdmin(cleanEmail, cleanEmail.split("@")[0]);
  }

  return updatedRoles;
}

/**
 * Remove an email from a role
 */
export async function removeEmailFromRole(
  email: string,
  roleId: string
): Promise<RoleDefinition[]> {
  const cleanEmail = email.toLowerCase().trim();
  const currentRoles = await loadRoleDefinitions();

  const updatedRoles = currentRoles.map((role) => {
    if (role.id === roleId) {
      return {
        ...role,
        assignedEmails: role.assignedEmails.filter(
          (e) => e.toLowerCase() !== cleanEmail
        ),
        updatedAt: new Date().toISOString(),
      };
    }
    return role;
  });

  await saveAllRoleDefinitions(updatedRoles);
  return updatedRoles;
}

/**
 * Fetch list of SuperAdmins stored in Firebase
 */
export async function loadSuperAdminCredentials(): Promise<SuperAdminCredential[]> {
  let list: SuperAdminCredential[] = [...DEFAULT_FIREBASE_SUPERADMINS];

  try {
    const cached = readStorage(STORAGE_KEY_SUPERADMINS);
    if (cached) {
      const parsed: SuperAdminCredential[] = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }
  } catch (e) {
    // ignore
  }

  try {
    if (firestoreDb) {
      const col = collection(firestoreDb, "superadmins");
      const snap = await getDocs(col);
      if (!snap.empty) {
        const remoteList: SuperAdminCredential[] = [];
        snap.forEach((docSnap) => {
          remoteList.push(docSnap.data() as SuperAdminCredential);
        });
        if (remoteList.length > 0) {
          list = remoteList;
          writeStorage(STORAGE_KEY_SUPERADMINS, JSON.stringify(list));
        }
      }
    }
  } catch (err) {
    console.warn("[rbac] Firestore loadSuperAdmins error:", err);
  }

  return list;
}

/**
 * Register or update SuperAdmin credentials in Firebase
 */
export async function registerSuperAdmin(
  email: string,
  fullName: string,
  notes?: string
): Promise<SuperAdminCredential[]> {
  const cleanEmail = email.toLowerCase().trim();
  const current = await loadSuperAdminCredentials();

  const newAdmin: SuperAdminCredential = {
    email: cleanEmail,
    fullName: fullName || cleanEmail.split("@")[0],
    role: "superadmin",
    isSuperAdmin: true,
    notes: notes || "Designated SuperAdmin in Firebase",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const filtered = current.filter(
    (a) => a.email.toLowerCase() !== cleanEmail
  );
  const updated = [newAdmin, ...filtered];

  writeStorage(STORAGE_KEY_SUPERADMINS, JSON.stringify(updated));

  try {
    if (firestoreDb) {
      const docRef = doc(firestoreDb, "superadmins", cleanEmail.replace(/[^a-zA-Z0-9_-]/g, "_"));
      await setDoc(docRef, newAdmin, { merge: true });
    }
  } catch (err) {
    console.warn("[rbac] Firestore save SuperAdmin error:", err);
  }

  return updated;
}

/**
 * Check if a role possesses a specific permission slug.
 * SuperAdmins unconditionally possess all permissions.
 */
export function hasRolePermission(
  roleId: string,
  permissionSlug: string,
  rolesList?: RoleDefinition[]
): boolean {
  if (roleId === "superadmin" || roleId === "admin") {
    return true;
  }

  const list = rolesList || BASELINE_ROLES;
  const role = list.find((r) => r.id === roleId);
  if (!role) return false;

  return role.permissions.includes(permissionSlug);
}
