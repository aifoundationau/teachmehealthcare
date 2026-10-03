"""Pydantic schemas for comments."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserResponse


class CommentCreate(BaseModel):
    """Schema for creating a new comment."""
    content: str
    parent_id: Optional[int] = None


class CommentResponse(BaseModel):
    """Schema for comment data in API responses, including nested replies."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    image_id: int
    author: UserResponse
    content: str
    parent_id: Optional[int] = None
    created_at: datetime
    replies: list[CommentResponse] = []
