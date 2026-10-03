"""Pydantic schemas for medical images."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserResponse


class ImageCreate(BaseModel):
    """Schema for creating a new medical image upload."""
    title: str
    modality: str  # xray, mri, ct, ultrasound, other
    body_region: str
    description: Optional[str] = None
    is_anonymized: bool = False


class ImageResponse(BaseModel):
    """Full schema for a single medical image with all details."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str] = None
    file_path: str
    thumbnail_path: Optional[str] = None
    modality: str
    body_region: str
    uploaded_by: int
    is_anonymized: bool
    ai_analysis: Optional[str] = None
    created_at: datetime
    uploader: UserResponse
    annotation_count: int = 0
    comment_count: int = 0


class ImageListResponse(BaseModel):
    """Lightweight schema for image listings/gallery view."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    thumbnail_path: Optional[str] = None
    modality: str
    body_region: str
    created_at: datetime
    uploader_name: str = ""
    annotation_count: int = 0
    comment_count: int = 0
