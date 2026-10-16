import { z } from "zod";

import type { Database } from "./db";
import type { Annotation, MedicalImage } from "./db/schema";
import { deleteEmbeddings, storeEmbedding } from "./embeddings";
import { FINDING_TYPES, SEVERITIES, lowercaseEnum, optionalText, requiredText } from "./validation";

/** Caliper/pin coordinates, when given as JSON, must be percentages within the image. */
function isValidLocation(value: string | null | undefined) {
  if (!value || !value.startsWith("{")) return true;
  try {
    const { x, y } = JSON.parse(value) as { x?: unknown; y?: unknown };
    const inRange = (n: unknown) => n === undefined || (typeof n === "number" && n >= 0 && n <= 100);
    return inRange(x) && inRange(y);
  } catch {
    return false;
  }
}

const annotationFields = {
  finding_type: lowercaseEnum(FINDING_TYPES),
  finding_description: requiredText(5, 5000),
  severity: lowercaseEnum(SEVERITIES).nullish(),
  location_on_image: optionalText(255).refine(isValidLocation, {
    message: "Coordinates must be JSON with x and y between 0 and 100",
  }),
  clinical_notes: optionalText(10_000),
};

export const createAnnotationSchema = z.object(annotationFields);
export const updateAnnotationSchema = z.object(annotationFields).partial();

/** Applies only the fields present in the request; null clears an optional field. */
export function annotationUpdates(body: z.infer<typeof updateAnnotationSchema>) {
  const updates: Partial<Annotation> = {};
  if (body.finding_type !== undefined) updates.findingType = body.finding_type;
  if (body.finding_description !== undefined) updates.findingDescription = body.finding_description;
  if (body.severity !== undefined) updates.severity = body.severity ?? null;
  if (body.location_on_image !== undefined) updates.locationOnImage = body.location_on_image || null;
  if (body.clinical_notes !== undefined) updates.clinicalNotes = body.clinical_notes || null;
  return updates;
}

/** (Re)builds the search embedding for an annotation. */
export async function indexAnnotation(db: Database, annotation: Annotation, image: MedicalImage) {
  await deleteEmbeddings(db, "annotation", annotation.id);
  await storeEmbedding(db, {
    contentType: "annotation",
    contentId: annotation.id,
    contentText:
      `Finding: ${annotation.findingType}. ` +
      `Description: ${annotation.findingDescription}. ` +
      `Location: ${annotation.locationOnImage || "unspecified"}. ` +
      `Severity: ${annotation.severity || "unspecified"}. ` +
      `Clinical notes: ${annotation.clinicalNotes || "none"}.`,
    imageId: image.id,
    metadata: { finding_type: annotation.findingType, body_region: image.bodyRegion, modality: image.modality },
  });
}
