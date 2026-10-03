"""Pydantic schemas for annotations."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserResponse


class AnnotationCreate(BaseModel):
    """Schema for creating a new annotation on an image."""
    finding_type: str  # fracture, dislocation, ligament_tear, etc.
    finding_description: str
    severity: Optional[str] = None  # mild, moderate, severe
    location_on_image: Optional[str] = None
    clinical_notes: Optional[str] = None


class AnnotationUpdate(BaseModel):
    """Schema for updating an existing annotation. All fields optional."""
    finding_type: Optional[str] = None
    finding_description: Optional[str] = None
    severity: Optional[str] = None
    location_on_image: Optional[str] = None
    clinical_notes: Optional[str] = None


class AnnotationResponse(BaseModel):
    """Schema for annotation data in API responses."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    image_id: int
    author: UserResponse
    finding_type: str
    finding_description: str
    severity: Optional[str] = None
    location_on_image: Optional[str] = None
    clinical_notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
