import { and, desc, eq, ilike, type SQL } from "drizzle-orm";
import { z } from "zod";

import { DOCTOR_ROLES, optionalUser, requireRole, requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { annotations, comments, medicalImages, users } from "@/server/db/schema";
import { APP_TAG, env } from "@/server/env";
import { ApiError, json, parseQuery, route } from "@/server/http";
import { stripImageMetadata, uploadToImgbb } from "@/server/imgbb";
import { imageResponse } from "@/server/serialize";
import { MODALITIES, lowercaseEnum, optionalText, requiredText } from "@/server/validation";

export const dynamic = "force-dynamic";

const listQuery = z.object({
  modality: z.string().optional(),
  body_region: z.string().optional(),
  uploaded_by: z.coerce.number().int().positive().optional(),
  skip: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/** Lists images, newest first, with optional filters. */
export const GET = route(async (req) => {
  await optionalUser(req);
  const query = parseQuery(req, listQuery);
  const db = await getDb();

  const conditions: SQL[] = [];
  if (query.modality) conditions.push(eq(medicalImages.modality, query.modality.toLowerCase()));
  if (query.body_region) {
    conditions.push(ilike(medicalImages.bodyRegion, `%${query.body_region.replace(/[\\%_]/g, (c) => `\\${c}`)}%`));
  }
  if (query.uploaded_by) conditions.push(eq(medicalImages.uploadedBy, query.uploaded_by));

  const rows = await db
    .select({
      image: medicalImages,
      uploaderName: users.fullName,
      annotationCount: db.$count(annotations, eq(annotations.imageId, medicalImages.id)),
      commentCount: db.$count(comments, eq(comments.imageId, medicalImages.id)),
    })
    .from(medicalImages)
    .leftJoin(users, eq(users.id, medicalImages.uploadedBy))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(medicalImages.createdAt), desc(medicalImages.id))
    .offset(query.skip)
    .limit(query.limit);

  return json(
    rows.map(({ image, uploaderName, annotationCount, commentCount }) => ({
      id: image.id,
      title: image.title,
      description: image.description,
      thumbnail_path: image.thumbnailPath,
      file_path: image.filePath,
      modality: image.modality,
      body_region: image.bodyRegion,
      created_at: image.createdAt.toISOString(),
      uploader_name: uploaderName ?? "Unknown",
      annotation_count: annotationCount,
      comment_count: commentCount,
    })),
  );
});

const uploadFields = z.object({
  title: requiredText(3, 255),
  modality: lowercaseEnum(MODALITIES),
  body_region: requiredText(2, 255),
  description: optionalText(5000),
  is_anonymized: z
    .string()
    .optional()
    .transform((v) => ["true", "1", "on", "yes"].includes((v ?? "").toLowerCase())),
});

/**
 * Uploads a scan (multipart form: file, title, modality, body_region, description,
 * is_anonymized). Available to authenticated users after login. Image metadata is removed before the
 * file is sent to ImgBB.
 */
export const POST = route(async (req) => {
  const user = await requireUser(req);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new ApiError(400, "Expected a multipart form upload.");
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) throw new ApiError(400, "No image file provided.");
  if (file.size > env.maxUploadMb * 1024 * 1024) {
    throw new ApiError(400, `File too large. Maximum size: ${env.maxUploadMb}MB`);
  }

  const fields = uploadFields.parse({
    title: form.get("title") ?? undefined,
    modality: form.get("modality") ?? undefined,
    body_region: form.get("body_region") ?? undefined,
    description: form.get("description") ?? undefined,
    is_anonymized: form.get("is_anonymized") ?? undefined,
  });

  const cleaned = await stripImageMetadata(Buffer.from(await file.arrayBuffer()), file.name);
  const hosted = await uploadToImgbb(cleaned.data, file.name.replace(/\.[^.]+$/, "") || "scan");

  const db = await getDb();
  const [image] = await db
    .insert(medicalImages)
    .values({
      title: fields.title,
      description: fields.description || null,
      filePath: hosted.url,
      thumbnailPath: hosted.thumbUrl,
      modality: fields.modality,
      bodyRegion: fields.body_region,
      uploadedBy: user.id,
      isAnonymized: fields.is_anonymized,
      appTag: APP_TAG,
    })
    .returning();

  return json(imageResponse(image, user, { annotations: 0, comments: 0 }), 201);
});
