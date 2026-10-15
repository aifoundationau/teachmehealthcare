/**
 * ImgBB Image Hosting & Album Integration
 * TeachMeHealthcare (tag: healthlms)
 * Album: https://ibb.co/album/TKRnX5
 */

export const IMGBB_API_KEY = "89dbf8bab69adf99de2c727bd9de3e37";
export const IMGBB_UPLOAD_URL = "https://api.imgbb.com/1/upload";
export const IMGBB_ALBUM_URL = "https://ibb.co/album/TKRnX5";

export interface ImgBBUploadResult {
  id: string;
  title: string;
  url: string;
  displayUrl: string;
  thumbUrl: string;
  deleteUrl?: string;
  albumUrl: string;
}

/**
 * Upload an image file or base64 data string directly to ImgBB
 */
export async function uploadImageToImgBB(
  fileOrBase64: File | Blob | string,
  name?: string
): Promise<ImgBBUploadResult> {
  const formData = new FormData();
  formData.append("key", IMGBB_API_KEY);

  if (typeof fileOrBase64 === "string") {
    // If data URL, strip prefix if needed or pass directly
    const cleanB64 = fileOrBase64.includes(",")
      ? fileOrBase64.split(",")[1]
      : fileOrBase64;
    formData.append("image", cleanB64);
  } else {
    formData.append("image", fileOrBase64);
  }

  if (name) {
    formData.append("name", name);
  }

  const response = await fetch(IMGBB_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ImgBB upload failed (${response.status}): ${errorText}`);
  }

  const json = await response.json();

  if (!json.success) {
    throw new Error(json.error?.message || "Failed to upload image to ImgBB");
  }

  const data = json.data;
  return {
    id: data.id,
    title: data.title || name || "Medical Scan",
    url: data.url,
    displayUrl: data.display_url || data.url,
    thumbUrl: data.thumb?.url || data.display_url || data.url,
    deleteUrl: data.delete_url,
    albumUrl: IMGBB_ALBUM_URL,
  };
}
