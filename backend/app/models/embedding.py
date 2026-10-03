"""Embedding model for vector storage used in RAG search."""

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Text, Integer, ForeignKey, func, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.image import MedicalImage


class Embedding(Base):
    """
    Stores vector embeddings of annotations, comments, and AI analyses
    for semantic search (RAG).
    """

    __tablename__ = "embeddings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    content_type: Mapped[str] = mapped_column(String(20), nullable=False)  # annotation, comment, ai_analysis
    content_id: Mapped[int] = mapped_column(Integer, nullable=False)
    content_text: Mapped[str] = mapped_column(Text, nullable=False)
    # Stored as serialized JSON string for vector array compatibility in SQLite
    embedding: Mapped[str] = mapped_column(Text, nullable=False)
    image_id: Mapped[int] = mapped_column(Integer, ForeignKey("medical_images.id"), nullable=False)
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    # Relationships
    image: Mapped["MedicalImage"] = relationship(lazy="selectin")

    def __repr__(self) -> str:
        return f"<Embedding(id={self.id}, content_type={self.content_type}, content_id={self.content_id})>"