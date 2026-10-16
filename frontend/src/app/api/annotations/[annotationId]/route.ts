import { eq } from "drizzle-orm";

import { annotationUpdates, indexAnnotation, updateAnnotationSchema } from "@/server/annotations";
import { canModify, requireUser } from "@/server/auth";
import { getDb, type Database } from "@/server/db";
import { annotations, users } from "@/server/db/schema";
import { deleteEmbeddings } from "@/server/embeddings";
import { ApiError, json, parseId, parseJson, route } from "@/server/http";
import { findImage } from "@/server/images";
import { annotationResponse, authorColumns } from "@/server/serialize";

export const dynamic = "force-dynamic";

type Params = { annotationId: string };

async function findAnnotation(db: Database, rawId: string) {
  const [row] = await db
    .select({ annotation: annotations, author: authorColumns })
    .from(annotations)
    .leftJoin(users, eq(users.id, annotations.authorId))
    .where(eq(annotations.id, parseId(rawId, "Annotation not found")));
  if (!row) throw new ApiError(404, "Annotation not found");
  return row;
}

/** Edits an annotation. Author or admin only. */
export const PUT = route<Params>(async (req, { params }) => {
  const user = await requireUser(req);
  const db = await getDb();
  const { annotation, author } = await findAnnotation(db, params.annotationId);
  if (!canModify(user, annotation.authorId)) throw new ApiError(403, "You can only edit your own annotations.");

  const updates = annotationUpdates(await parseJson(req, updateAnnotationSchema));
  if (!Object.keys(updates).length) return json(annotationResponse(annotation, author));

  const [updated] = await db.update(annotations).set(updates).where(eq(annotations.id, annotation.id)).returning();
  await indexAnnotation(db, updated, await findImage(db, updated.imageId));
  return json(annotationResponse(updated, author));
});

/** Deletes an annotation. Author or admin only. */
export const DELETE = route<Params>(async (req, { params }) => {
  const user = await requireUser(req);
  const db = await getDb();
  const { annotation } = await findAnnotation(db, params.annotationId);
  if (!canModify(user, annotation.authorId)) throw new ApiError(403, "You can only delete your own annotations.");

  await deleteEmbeddings(db, "annotation", annotation.id);
  await db.delete(annotations).where(eq(annotations.id, annotation.id));
  return new Response(null, { status: 204 });
});
