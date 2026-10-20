// Real Firebase & Google OAuth client for TeachMeHealthcare
// Fully compatible with Next.js SSR, tagged with 'healthlms'

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

import { apiFetch } from "@/lib/api";
import { removeStorage, writeStorage } from "@/lib/storage";

export const APP_TAG = process.env.NEXT_PUBLIC_APP_TAG || "healthlms";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCPeAOWQj8456TeIWDIPsyxyWT7QLrC8J8",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ai-foundation-firebase.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ai-foundation-firebase",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ai-foundation-firebase.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "614773274800",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:614773274800:web:77c2a66e4e8c4409afb221938dfacd7e",
};

export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "614773274800-9pooin0jia9ij91qjlk7r6r6ne02mbhg.apps.googleusercontent.com";

// Safe SSR Firebase App initialization
let app: FirebaseApp | undefined;
let auth: any;
let firestoreDb: Firestore | undefined;
let googleProvider: any;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  firestoreDb = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: "select_account",
  });
} catch (e) {
  console.warn("Firebase client initialization note:", e);
}

export { app, auth, googleProvider, firestoreDb };

export interface SupporterRegistrationData {
  email: string;
  password: string; // Secondary login password backup
  fullName: string;
  profession?: string;
  phoneNumber?: string;
  address?: string;
  comments?: string;
  role?: string;
  appTag?: string;
  firebaseUid?: string;
}

export interface UserProfile {
  id?: number;
  firebaseUid?: string;
  uid?: string;
  email: string;
  fullName: string;
  displayName?: string;
  role: "supporter" | "doctor" | "student" | "admin" | string;
  profession?: string;
  phoneNumber?: string;
  address?: string;
  comments?: string;
  appTag: string;
  photoURL?: string | null;
  accessToken?: string;
  token?: string;
  user?: any;
}

type AuthCallback = (user: UserProfile | null) => void;
const authListeners: Set<AuthCallback> = new Set();

let currentCachedUser: UserProfile | null = null;

if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem("tmh_user");
    if (raw) {
      currentCachedUser = JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to load cached user:", e);
  }
}

export function onAuthStateChanged(_unusedAuth: any, callback: AuthCallback): () => void {
  authListeners.add(callback);
  if (currentCachedUser) {
    callback(currentCachedUser);
  }

  let unsubscribeFb = () => {};
  if (typeof window !== "undefined" && auth && fbOnAuthStateChanged) {
    try {
      unsubscribeFb = fbOnAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          const profile: UserProfile = {
            firebaseUid: fbUser.uid,
            email: fbUser.email || "",
            fullName: fbUser.displayName || currentCachedUser?.fullName || "Supporter User",
            role: currentCachedUser?.role || "supporter",
            profession: currentCachedUser?.profession,
            phoneNumber: currentCachedUser?.phoneNumber,
            address: currentCachedUser?.address,
            comments: currentCachedUser?.comments,
            appTag: APP_TAG,
            photoURL: fbUser.photoURL,
          };
          notifyAuthState(profile);
        }
      });
    } catch (e) {
      console.warn("Firebase auth state listener notice:", e);
    }
  }

  return () => {
    authListeners.delete(callback);
    unsubscribeFb();
  };
}

export function notifyAuthState(user: UserProfile | null) {
  currentCachedUser = user;
  if (typeof window !== "undefined") {
    if (user) {
      writeStorage("tmh_user", JSON.stringify(user));
    } else {
      removeStorage("tmh_user");
    }
  }
  authListeners.forEach((cb) => {
    try {
      cb(user);
    } catch (err) {
      console.error("Auth listener error:", err);
    }
  });
}

export const db = {};

/**
 * Sign in or start registration with real Google OAuth popup
 */
export async function signInWithGooglePopup(): Promise<{
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  idToken?: string;
}> {
  if (typeof window === "undefined" || !auth || !googleProvider) {
    throw new Error("Google sign-in is only available in the browser.");
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const idToken = await user.getIdToken();

    const verifiedUser = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || user.email?.split("@")[0] || "Supporter User",
      photoURL: user.photoURL || "",
      idToken,
    };

    return verifiedUser;
  } catch (err: any) {
    console.error("Firebase Google Auth error:", err);
    if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
      throw new Error("Sign-in cancelled. The Google popup was closed.");
    }
    if (err.code === "auth/popup-blocked") {
      throw new Error("Popup blocked by browser. Please allow popups for this site to sign in with Google.");
    }
    if (err.code === "auth/unauthorized-domain") {
      throw new Error(
        `Domain unauthorized in Firebase: "${window.location.hostname}". Please add this domain to Firebase Console -> Authentication -> Settings -> Authorized Domains.`
      );
    }
    throw new Error(err.message || "Failed to authenticate with Google.");
  }
}

/**
 * Save or update supporter profile in Firestore with special tag 'healthlms'
 */
export async function saveSupporterToFirestore(uid: string, data: Partial<SupporterRegistrationData>) {
  try {
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/supporters/${uid}`;
    await fetch(firestoreUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          uid: { stringValue: uid },
          email: { stringValue: data.email || "" },
          fullName: { stringValue: data.fullName || "" },
          profession: { stringValue: data.profession || "" },
          phoneNumber: { stringValue: data.phoneNumber || "" },
          address: { stringValue: data.address || "" },
          comments: { stringValue: data.comments || "" },
          role: { stringValue: "supporter" },
          app_tag: { stringValue: APP_TAG },
          updated_at: { timestampValue: new Date().toISOString() },
        },
      }),
    });
  } catch (err) {
    console.warn("Firestore save note:", err);
  }
}

/**
 * Sync supporter registration details to the site's API. The server takes the email
 * and account identity from the signed-in user's Firebase token, so only the profile
 * details are sent.
 */
export async function syncSupporterToBackend(data: SupporterRegistrationData): Promise<UserProfile> {
  const payload = {
    full_name: data.fullName,
    profession: data.profession || null,
    phone_number: data.phoneNumber || null,
    address: data.address || null,
    comments: data.comments || null,
  };

  try {
    const res = await apiFetch("/auth/supporter-register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => null);
      console.warn("Backend sync rejected:", res.status, error?.detail);
    } else {
      const userRes = await res.json();
      const profile: UserProfile = {
        id: userRes.id,
        email: userRes.email,
        fullName: userRes.full_name || data.fullName,
        role: userRes.role || "supporter",
        profession: userRes.profession || data.profession,
        phoneNumber: userRes.phone_number || data.phoneNumber,
        address: userRes.address || data.address,
        comments: userRes.supporter_comments || data.comments,
        appTag: userRes.app_tag || APP_TAG,
        firebaseUid: userRes.firebase_uid || data.firebaseUid,
      };
      notifyAuthState(profile);
      return profile;
    }
  } catch (err) {
    console.warn("Backend sync notice:", err);
  }

  // Graceful fallback with full personal details
  const localProfile: UserProfile = {
    email: data.email,
    fullName: data.fullName,
    role: "supporter",
    profession: data.profession,
    phoneNumber: data.phoneNumber,
    address: data.address,
    comments: data.comments,
    appTag: APP_TAG,
    firebaseUid: data.firebaseUid,
  };
  notifyAuthState(localProfile);
  return localProfile;
}

/**
 * Log out user from both Firebase Auth and local session
 */
export async function logOutUser(): Promise<void> {
  if (typeof window !== "undefined") {
    try {
      if (auth && auth.signOut) {
        await fbSignOut(auth);
      }
    } catch (e) {
      console.warn("Firebase sign out note:", e);
    }
    removeStorage("tmh_user");
    removeStorage("tmh_token");
  }
  notifyAuthState(null);
}
