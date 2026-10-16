import { desc, eq } from "drizzle-orm";

import { createAnnotationSchema, indexAnnotation } from "@/server/annotations";
import { DOCTOR_ROLES, requireRole, requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { annotations, users } from "@/server/db/schema";
import { json, parseId, parseJson, route } from "@/server/http";
import { findImage } from "@/server/images";
import { annotationResponse, authorColumns } from "@/server/serialize";

export const dynamic = "force-dynamic";

type Params = { imageId: string };

/** Lists an image's annotations, newest first. */
export const GET = route<Params>(async (req, { params }) => {
  await requireUser(req);
  const db = await getDb();
  const image = await findImage(db, parseId(params.imageId, "Image not found"));

  const rows = await db
    .select({ annotation: annotations, author: authorColumns })
    .from(annotations)
    .leftJoin(users, eq(users.id, annotations.authorId))
    .where(eq(annotations.imageId, image.id))
    .orderBy(desc(annotations.createdAt), desc(annotations.id));
  return json(rows.map((r) => annotationResponse(r.annotation, r.author)));
});

/** Adds a clinical finding to an image. Doctors and admins only. */
export const POST = route<Params>(async (req, { params }) => {
  const user = await requireUser(req);
  requireRole(user, DOCTOR_ROLES);
  const db = await getDb();
  const image = await findImage(db, parseId(params.imageId, "Image not found"));
  const body = await parseJson(req, createAnnotationSchema);

  const [annotation] = await db
    .insert(annotations)
    .values({
      imageId: image.id,
      authorId: user.id,
      findingType: body.finding_type,
      findingDescription: body.finding_description,
      severity: body.severity ?? null,
      locationOnImage: body.location_on_image || null,
      clinicalNotes: body.clinical_notes || null,
    })
    .returning();

  await indexAnnotation(db, annotation, image);
  return json(annotationResponse(annotation, user), 201);
});
