/**
 * JSON response shapes. Field names stay snake_case to match the FastAPI responses.
 *
 * Other people's records only ever include the public author fields: email, phone number,
 * address and supporter comments are returned to the account owner alone.
 */

import { users, type Annotation, type Comment, type MedicalImage, type User } from "./db/schema";

export function userResponse(user: User) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.fullName,
    role: user.role,
    specialization: user.specialization,
    profession: user.profession,
    phone_number: user.phoneNumber,
    address: user.address,
    supporter_comments: user.supporterComments,
    app_tag: user.appTag,
    firebase_uid: user.firebaseUid,
    is_verified: user.isVerified,
    created_at: user.createdAt.toISOString(),
  };
}

export type PublicAuthor = Pick<User, "id" | "fullName" | "role" | "specialization" | "profession">;

/** Columns to select (usually via a join) for an author shown to other users. */
export const authorColumns = {
  id: users.id,
  fullName: users.fullName,
  role: users.role,
  specialization: users.specialization,
  profession: users.profession,
};

export function authorResponse(author: PublicAuthor | null) {
  if (!author) return null;
  return {
    id: author.id,
    full_name: author.fullName,
    role: author.role,
    specialization: author.specialization,
    profession: author.profession,
  };
}

export function imageResponse(
  image: MedicalImage,
  uploader: PublicAuthor | null,
  counts: { annotations: number; comments: number },
) {
  return {
    id: image.id,
    title: image.title,
    description: image.description,
    file_path: image.filePath,
    thumbnail_path: image.thumbnailPath,
    modality: image.modality,
    body_region: image.bodyRegion,
    uploaded_by: image.uploadedBy,
    is_anonymized: image.isAnonymized,
    ai_analysis: image.aiAnalysis,
    app_tag: image.appTag,
    created_at: image.createdAt.toISOString(),
    uploader: authorResponse(uploader),
    annotation_count: counts.annotations,
    comment_count: counts.comments,
  };
}

export function annotationResponse(annotation: Annotation, author: PublicAuthor | null) {
  return {
    id: annotation.id,
    image_id: annotation.imageId,
    author: authorResponse(author),
    finding_type: annotation.findingType,
    finding_description: annotation.findingDescription,
    severity: annotation.severity,
    location_on_image: annotation.locationOnImage,
    clinical_notes: annotation.clinicalNotes,
    created_at: annotation.createdAt.toISOString(),
    updated_at: annotation.updatedAt?.toISOString() ?? null,
  };
}

export interface CommentNode {
  id: number;
  image_id: number;
  author: ReturnType<typeof authorResponse>;
  content: string;
  parent_id: number | null;
  created_at: string;
  replies: CommentNode[];
}

export function commentResponse(comment: Comment, author: PublicAuthor | null): CommentNode {
  return {
    id: comment.id,
    image_id: comment.imageId,
    author: authorResponse(author),
    content: comment.content,
    parent_id: comment.parentId,
    created_at: comment.createdAt.toISOString(),
    replies: [],
  };
}

/** Builds the reply tree. Top-level comments come newest first; replies read oldest first. */
export function commentTree(rows: { comment: Comment; author: PublicAuthor | null }[]) {
  const sorted = [...rows].sort((a, b) => a.comment.createdAt.getTime() - b.comment.createdAt.getTime());
  const nodes = new Map<number, CommentNode>();
  for (const { comment, author } of sorted) nodes.set(comment.id, commentResponse(comment, author));

  const roots: CommentNode[] = [];
  for (const node of Array.from(nodes.values())) {
    const parent = node.parent_id != null ? nodes.get(node.parent_id) : undefined;
    if (parent) parent.replies.push(node);
    else roots.push(node);
  }
  return roots.reverse();
}
