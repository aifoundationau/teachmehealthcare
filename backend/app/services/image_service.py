import os
import uuid
import base64
import logging
from pathlib import Path

import httpx
from fastapi import UploadFile, HTTPException, status
from PIL import Image

from app.config import settings

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".tiff", ".tif", ".bmp", ".webp", ".dcm"}
THUMBNAIL_MAX_SIZE = (400, 400)


async def upload_to_imgbb(content: bytes, name: str) -> dict | None:
    """Upload image bytes to ImgBB and return URLs."""
    try:
        b64 = base64.b64encode(content).decode("utf-8")
        data = {
            "key": settings.IMGBB_API_KEY,
            "image": b64,
            "name": name,
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(settings.IMGBB_UPLOAD_URL, data=data)
            if resp.status_code == 200:
                res = resp.json()
                if res.get("success"):
                    d = res["data"]
                    return {
                        "url": d["url"],
                        "display_url": d["display_url"],
                        "thumb": d.get("thumb", {}).get("url", d["url"]),
                        "delete_url": d.get("delete_url"),
                    }
    except Exception as e:
        logger.warning(f"ImgBB upload error: {e}")
    return None


async def save_upload_file(file: UploadFile) -> tuple[str, str | None]:
    """
    Validate, save an uploaded medical image, and generate a thumbnail.
    Automatically uploads to ImgBB when available.

    Raises:
        HTTPException: If file type is invalid or file is too large.
    """
    # Validate file extension
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No filename provided")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{ext}' not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    # Read file content
    content = await file.read()

    # Validate file size
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE_MB}MB",
        )

    # Generate unique filename
    unique_id = uuid.uuid4().hex
    filename = f"{unique_id}{ext}"
    thumbnail_filename = f"{unique_id}_thumb.jpg"

    # Ensure upload directories exist
    upload_dir = Path(settings.UPLOAD_DIR)
    images_dir = upload_dir / "images"
    thumbs_dir = upload_dir / "thumbnails"
    images_dir.mkdir(parents=True, exist_ok=True)
    thumbs_dir.mkdir(parents=True, exist_ok=True)

    # Save original file
    file_path = images_dir / filename
    with open(file_path, "wb") as f:
        f.write(content)

    # Generate thumbnail
    thumbnail_path = None
    try:
        if ext != ".dcm":  # Skip DICOM for thumbnail generation
            img = Image.open(file_path)
            img.thumbnail(THUMBNAIL_MAX_SIZE, Image.Resampling.LANCZOS)
            # Convert to RGB if necessary (e.g., RGBA PNGs)
            if img.mode in ("RGBA", "P", "LA"):
                img = img.convert("RGB")
            thumb_path = thumbs_dir / thumbnail_filename
            img.save(thumb_path, "JPEG", quality=85)
            thumbnail_path = f"thumbnails/{thumbnail_filename}"
    except Exception:
        # Thumbnail generation is non-critical; continue without it
        thumbnail_path = None

    # Upload to ImgBB
    imgbb_result = await upload_to_imgbb(content, Path(file.filename or unique_id).stem)
    if imgbb_result:
        return imgbb_result["url"], imgbb_result["thumb"]

    return f"images/{filename}", thumbnail_path


def get_full_image_path(relative_path: str) -> str:
    """Get the absolute filesystem path for a stored image."""
    return os.path.join(settings.UPLOAD_DIR, relative_path)


def delete_image_files(file_path: str, thumbnail_path: str | None) -> None:
    """Delete image and thumbnail files from disk."""
    full_path = Path(settings.UPLOAD_DIR) / file_path
    if full_path.exists():
        full_path.unlink()

    if thumbnail_path:
        thumb_full = Path(settings.UPLOAD_DIR) / thumbnail_path
        if thumb_full.exists():
            thumb_full.unlink()
