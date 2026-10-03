"""Annotation model for doctor findings on medical images."""

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Text, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.image import MedicalImage
    from app.models.user import User


class Annotation(Base):
    """
    Represents a doctor's clinical finding/annotation on a medical image.

    Each annotation captures a specific finding (fracture, tear, etc.)
    with severity, location, and detailed clinical notes.
    """

    __tablename__ = "annotations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    image_id: Mapped[int] = mapped_column(Integer, ForeignKey("medical_images.id"), nullable=False)
    author_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    finding_type: Mapped[str] = mapped_column(String(50), nullable=False)
    finding_description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # mild, moderate, severe
    location_on_image: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    clinical_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[Optional[datetime]] = mapped_column(onupdate=func.now(), nullable=True)

    # Relationships
    image: Mapped["MedicalImage"] = relationship(back_populates="annotations")
    author: Mapped["User"] = relationship(back_populates="annotations", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Annotation(id={self.id}, finding_type={self.finding_type}, severity={self.severity})>"
