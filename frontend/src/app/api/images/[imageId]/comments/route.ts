import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { comments, users } from "@/server/db/schema";
import { storeEmbedding } from "@/server/embeddings";
import { ApiError, json, parseId, parseJson, route } from "@/server/http";
import { findImage } from "@/server/images";
import { authorColumns, commentResponse, commentTree } from "@/server/serialize";
import { requiredText } from "@/server/validation";

export const dynamic = "force-dynamic";

type Params = { imageId: string };

/** The image's discussion as a reply tree: top-level comments newest first. */
export const GET = route<Params>(async (req, { params }) => {
  await requireUser(req);
  const db = await getDb();
  const image = await findImage(db, parseId(params.imageId, "Image not found"));

  const rows = await db
    .select({ comment: comments, author: authorColumns })
    .from(comments)
    .leftJoin(users, eq(users.id, comments.authorId))
    .where(eq(comments.imageId, image.id));
  return json(commentTree(rows));
});

const createCommentSchema = z.object({
  content: requiredText(1, 2000),
  parent_id: z.number().int().positive().nullish(),
});

/** Posts a comment or reply. Any signed-in user can comment. */
export const POST = route<Params>(async (req, { params }) => {
  const user = await requireUser(req);
  const db = await getDb();
  const image = await findImage(db, parseId(params.imageId, "Image not found"));
  const body = await parseJson(req, createCommentSchema);

  if (body.parent_id) {
    const [parent] = await db
      .select({ id: comments.id })
      .from(comments)
      .where(and(eq(comments.id, body.parent_id), eq(comments.imageId, image.id)));
    if (!parent) throw new ApiError(400, "Parent comment not found or belongs to a different image.");
  }

  const [comment] = await db
    .insert(comments)
    .values({ imageId: image.id, authorId: user.id, parentId: body.parent_id ?? null, content: body.content })
    .returning();

  await storeEmbedding(db, {
    contentType: "comment",
    contentId: comment.id,
    contentText: comment.content,
    imageId: image.id,
    metadata: { body_region: image.bodyRegion, modality: image.modality },
  });
  return json(commentResponse(comment, user), 201);
});
