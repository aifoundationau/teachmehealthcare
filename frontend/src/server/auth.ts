/**
 * Authentication: every request carries a Firebase ID token (`Authorization: Bearer <token>`),
 * which is verified against Google's signing keys. The email and UID come from the verified
 * token, never from the request body.
 */

import { eq, or } from "drizzle-orm";
import { createRemoteJWKSet, errors, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from "jose";
import type { NextRequest } from "next/server";

import { getDb } from "./db";
import { users, type User } from "./db/schema";
import { APP_TAG, env } from "./env";
import { ApiError } from "./http";
import type { Role } from "./validation";

const FIREBASE_JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

let firebaseKeySet: JWTVerifyGetKey = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));

/** Swaps Google's signing keys for test keys, so the API smoke test can sign its own tokens. */
export function setFirebaseKeySetForTesting(keySet: JWTVerifyGetKey) {
  firebaseKeySet = keySet;
}

export interface FirebaseClaims {
  uid: string;
  email: string;
  name?: string;
}

export async function verifyFirebaseIdToken(token: string): Promise<FirebaseClaims> {
  const projectId = env.firebaseProjectId;
  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(token, firebaseKeySet, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ["RS256"],
      clockTolerance: 5,
    }));
  } catch (err) {
    if (err instanceof errors.JWKSTimeout) {
      throw new ApiError(503, "Sign-in verification is temporarily unavailable.");
    }
    if (err instanceof errors.JOSEError) throw new ApiError(401, "Could not validate credentials");
    throw err;
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload.sub || typeof payload.auth_time !== "number" || payload.auth_time > now + 5) {
    throw new ApiError(401, "Could not validate credentials");
  }
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (!email || payload.email_verified !== true) {
    throw new ApiError(403, "A verified email address is required.");
  }
  return {
    uid: payload.sub,
    email,
    name: typeof payload.name === "string" ? payload.name : undefined,
  };
}

function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/**
 * Finds the user for a verified sign-in, creating a supporter account on first sign-in.
 * An existing account with the same (Google-verified) email is linked to this Firebase UID.
 */
export async function findOrCreateUser(claims: FirebaseClaims): Promise<User> {
  const db = await getDb();
  const matches = await db
    .select()
    .from(users)
    .where(or(eq(users.firebaseUid, claims.uid), eq(users.email, claims.email)));

  const existing = matches.find((u) => u.firebaseUid === claims.uid) ?? matches[0];
  if (existing) {
    if (existing.firebaseUid === claims.uid) return existing;
    const [linked] = await db
      .update(users)
      .set({ firebaseUid: claims.uid })
      .where(eq(users.id, existing.id))
      .returning();
    return linked;
  }

  const [created] = await db
    .insert(users)
    .values({
      email: claims.email,
      firebaseUid: claims.uid,
      fullName: (claims.name || claims.email.split("@")[0]).slice(0, 255),
      role: "supporter",
      appTag: APP_TAG,
    })
    .onConflictDoNothing()
    .returning();
  if (created) return created;

  // Another request created the account at the same moment.
  const [raced] = await db.select().from(users).where(eq(users.firebaseUid, claims.uid));
  if (!raced) throw new ApiError(409, "An account with this email is linked to a different sign-in.");
  return raced;
}

/** The signed-in user. Throws 401 without a valid token and 403 for unverified accounts. */
export async function requireUser(req: NextRequest): Promise<User> {
  const token = bearerToken(req);
  if (!token) throw new ApiError(401, "Not authenticated");
  const user = await findOrCreateUser(await verifyFirebaseIdToken(token));
  if (!user.isVerified) {
    throw new ApiError(403, "Account not verified. Please contact an administrator.");
  }
  return user;
}

/** The signed-in user, or null when the request has no valid token. */
export async function optionalUser(req: NextRequest): Promise<User | null> {
  if (!bearerToken(req)) return null;
  try {
    return await requireUser(req);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) return null;
    throw err;
  }
}

export const DOCTOR_ROLES: readonly Role[] = ["doctor", "admin"];

export function requireRole(user: User, roles: readonly Role[]) {
  if (!roles.includes(user.role as Role)) {
    throw new ApiError(403, `Access denied. Required role(s): ${roles.join(", ")}`);
  }
}

export function canModify(user: User, ownerId: number) {
  return user.id === ownerId || user.role === "admin";
}
