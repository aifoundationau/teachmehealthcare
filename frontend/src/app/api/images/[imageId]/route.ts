import { eq } from "drizzle-orm";

import { canModify, requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { medicalImages } from "@/server/db/schema";
import { ApiError, json, parseId, route } from "@/server/http";
import { findImage, findImageWithDetails } from "@/server/images";
import { imageResponse } from "@/server/serialize";

export const dynamic = "force-dynamic";

type Params = { imageId: string };

export const GET = route<Params>(async (req, { params }) => {
  await requireUser(req);
  const db = await getDb();
  const row = await findImageWithDetails(db, parseId(params.imageId, "Image not found"));
  return json(
    imageResponse(row.image, row.uploader, { annotations: row.annotationCount, comments: row.commentCount }),
  );
});

/**
 * Deletes an image with its annotations, comments and search entries. Owner or admin only.
 * The copy on ImgBB stays; remove it from the ImgBB album if needed.
 */
export const DELETE = route<Params>(async (req, { params }) => {
  const user = await requireUser(req);
  const db = await getDb();
  const image = await findImage(db, parseId(params.imageId, "Image not found"));
  if (!canModify(user, image.uploadedBy)) throw new ApiError(403, "You can only delete your own images.");

  await db.delete(medicalImages).where(eq(medicalImages.id, image.id));
  return new Response(null, { status: 204 });
});
