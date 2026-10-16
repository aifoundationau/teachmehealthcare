/** Shared input rules from data-contracts.md. */

import { z } from "zod";

export const MODALITIES = ["xray", "mri", "ct", "ultrasound", "other"] as const;
export const FINDING_TYPES = [
  "fracture",
  "dislocation",
  "ligament_tear",
  "soft_tissue",
  "degenerative",
  "tumor",
  "infection",
  "normal",
  "other",
] as const;
export const SEVERITIES = ["mild", "moderate", "severe"] as const;
export const ROLES = ["supporter", "student", "doctor", "admin"] as const;
export type Role = (typeof ROLES)[number];

/** Removes HTML tags and control characters, then trims. React escapes output too; this keeps stored text clean. */
export function cleanText(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}

export const requiredText = (min: number, max: number) =>
  z.string().transform(cleanText).pipe(z.string().min(min).max(max));

/**
 * Optional free-text field. `undefined`/`null` mean "leave unchanged";
 * an empty string clears the value.
 */
export const optionalText = (max: number) =>
  z.string().transform(cleanText).pipe(z.string().max(max)).nullish();

/** E.164 or Australian national format, with spaces, dashes, dots and brackets removed. */
export const phoneNumber = z
  .string()
  .transform((v) => cleanText(v).replace(/[\s().-]/g, ""))
  .pipe(z.string().regex(/^(\+?\d{6,15})?$/, "Enter a valid phone number"))
  .nullish();

export const lowercaseEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .string()
    .transform((v) => v.trim().toLowerCase())
    .pipe(z.enum(values));
