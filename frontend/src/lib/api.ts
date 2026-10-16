import { getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

/**
 * Calls this site's API (`/api/...`) with the signed-in user's Firebase ID token.
 * The server verifies that token on every request; Firebase refreshes it automatically.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);

  if (getApps().length) {
    const auth = getAuth(getApp());
    await auth.authStateReady();
    const token = await auth.currentUser?.getIdToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  if (typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`/api${path}`, { ...init, headers });
}
