import { eq } from "drizzle-orm";

import type { Database } from "./db";
import { annotations, comments, medicalImages, users } from "./db/schema";
import { ApiError } from "./http";
import { authorColumns } from "./serialize";

export async function findImage(db: Database, imageId: number) {
  const [image] = await db.select().from(medicalImages).where(eq(medicalImages.id, imageId));
  if (!image) throw new ApiError(404, "Image not found");
  return image;
}

/** An image with its uploader's public details and annotation/comment counts. */
export async function findImageWithDetails(db: Database, imageId: number) {
  const [row] = await db
    .select({
      image: medicalImages,
      uploader: authorColumns,
      annotationCount: db.$count(annotations, eq(annotations.imageId, medicalImages.id)),
      commentCount: db.$count(comments, eq(comments.imageId, medicalImages.id)),
    })
    .from(medicalImages)
    .leftJoin(users, eq(users.id, medicalImages.uploadedBy))
    .where(eq(medicalImages.id, imageId));
  if (!row) throw new ApiError(404, "Image not found");
  return row;
}
