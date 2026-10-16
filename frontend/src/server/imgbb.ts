/** Medical image uploads: metadata removal and hosting on ImgBB (data-contracts.md, Domain 2). */

import sharp from "sharp";

import { env } from "./env";
import { ApiError } from "./http";

const IMGBB_UPLOAD_URL = "https://api.imgbb.com/1/upload";
const SUPPORTED_FORMATS = ["jpeg", "png", "webp"] as const;
type SupportedFormat = (typeof SUPPORTED_FORMATS)[number];

const isDicom = (bytes: Buffer, filename: string) =>
  filename.toLowerCase().endsWith(".dcm") ||
  (bytes.length > 132 && bytes.toString("latin1", 128, 132) === "DICM");

/**
 * Re-encodes the image, which drops all EXIF/XMP/ICC metadata (camera details, dates,
 * GPS, embedded patient text). Rotation from EXIF is applied first so the image still
 * displays the right way up.
 */
export async function stripImageMetadata(bytes: Buffer, filename: string): Promise<{ data: Buffer; mimeType: string }> {
  if (isDicom(bytes, filename)) {
    throw new ApiError(
      400,
      "DICOM files can't be hosted on ImgBB. Export the image as PNG or JPEG with patient details removed, then upload that.",
    );
  }

  let format: string | undefined;
  try {
    format = (await sharp(bytes).metadata()).format;
  } catch {
    throw new ApiError(400, "The file isn't a readable image.");
  }
  if (!SUPPORTED_FORMATS.includes(format as SupportedFormat)) {
    throw new ApiError(400, "Unsupported image type. Upload a JPEG, PNG or WebP image.");
  }

  const image = sharp(bytes).rotate();
  const data =
    format === "jpeg"
      ? await image.jpeg({ quality: 95 }).toBuffer()
      : format === "png"
        ? await image.png().toBuffer()
        : await image.webp({ quality: 95 }).toBuffer();
  return { data, mimeType: `image/${format}` };
}

export async function uploadToImgbb(data: Buffer, name: string): Promise<{ url: string; thumbUrl: string }> {
  if (!env.imgbbApiKey) throw new ApiError(503, "Image hosting is not configured (IMGBB_API_KEY is not set).");

  const form = new FormData();
  form.append("key", env.imgbbApiKey);
  form.append("name", name);
  form.append("image", new Blob([new Uint8Array(data)]), name);

  let body: { success?: boolean; data?: { url: string; thumb?: { url: string } }; error?: { message?: string } } | null =
    null;
  try {
    const res = await fetch(IMGBB_UPLOAD_URL, { method: "POST", body: form, signal: AbortSignal.timeout(60_000) });
    body = await res.json().catch(() => null);
  } catch (err) {
    console.error("[imgbb] Upload request failed:", err);
  }
  if (!body?.success || !body.data) {
    throw new ApiError(502, `Image upload to ImgBB failed${body?.error?.message ? `: ${body.error.message}` : "."}`);
  }
  return { url: body.data.url, thumbUrl: body.data.thumb?.url ?? body.data.url };
}

/** Downloads a stored image for AI analysis. Only ImgBB-hosted URLs are fetched. */
export async function downloadHostedImage(url: string): Promise<{ data: Buffer; mimeType: string }> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new ApiError(422, "This image has no hosted file to analyse.");
  }
  if (parsed.protocol !== "https:" || !(parsed.hostname === "ibb.co" || parsed.hostname.endsWith(".ibb.co"))) {
    throw new ApiError(422, "Only ImgBB-hosted images can be analysed.");
  }

  const res = await fetch(parsed, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new ApiError(502, `Couldn't download the image from ImgBB (HTTP ${res.status}).`);
  const mimeType = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  return { data: Buffer.from(await res.arrayBuffer()), mimeType };
}
