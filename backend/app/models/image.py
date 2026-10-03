"""MedicalImage model for uploaded medical images."""

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Boolean, Text, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.annotation import Annotation
    from app.models.comment import Comment


class MedicalImage(Base):
    """
    Represents an uploaded medical image (X-ray, MRI, CT scan, etc.)
    with metadata, cached AI analysis, and relationships to annotations/comments.
    """

    __tablename__ = "medical_images"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    thumbnail_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    modality: Mapped[str] = mapped_column(String(20), nullable=False)  # xray, mri, ct, ultrasound, other
    body_region: Mapped[str] = mapped_column(String(255), nullable=False)
    uploaded_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    is_anonymized: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    ai_analysis: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    # Relationships
    uploader: Mapped["User"] = relationship(back_populates="images", lazy="selectin")
    annotations: Mapped[list["Annotation"]] = relationship(back_populates="image", cascade="all, delete-orphan")
    comments: Mapped[list["Comment"]] = relationship(back_populates="image", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<MedicalImage(id={self.id}, title={self.title}, modality={self.modality})>"
