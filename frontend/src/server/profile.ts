import { z } from "zod";

import type { users } from "./db/schema";
import { optionalText, phoneNumber } from "./validation";

/** Personal details a signed-in user can set on their own account (data-contracts.md, Domain 1). */
export const profileSchema = z.object({
  full_name: optionalText(255),
  profession: optionalText(255),
  phone_number: phoneNumber,
  address: optionalText(500),
  comments: optionalText(2000),
  // The frontend has sent this name for the comments field; accept either.
  supporter_comments: optionalText(2000),
});

/** Fields left out (or null) stay unchanged; an empty string clears an optional field. */
export function profileUpdates(body: z.infer<typeof profileSchema>) {
  const updates: Partial<typeof users.$inferInsert> = {};
  if (body.full_name) updates.fullName = body.full_name;
  if (body.profession != null) updates.profession = body.profession || null;
  if (body.phone_number != null) updates.phoneNumber = body.phone_number || null;
  if (body.address != null) updates.address = body.address || null;
  const comments = body.comments ?? body.supporter_comments;
  if (comments != null) updates.supporterComments = comments || null;
  return updates;
}
