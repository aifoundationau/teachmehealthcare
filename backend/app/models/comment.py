"""Comment model for threaded discussions on medical images."""

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Text, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.image import MedicalImage
    from app.models.user import User


class Comment(Base):
    """
    Represents a comment on a medical image.
    Supports threading via self-referential parent_id.
    """

    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    image_id: Mapped[int] = mapped_column(Integer, ForeignKey("medical_images.id"), nullable=False)
    author_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    parent_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("comments.id"), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[Optional[datetime]] = mapped_column(onupdate=func.now(), nullable=True)

    # Relationships
    image: Mapped["MedicalImage"] = relationship(back_populates="comments")
    author: Mapped["User"] = relationship(back_populates="comments", lazy="selectin")
    parent: Mapped[Optional["Comment"]] = relationship(
        back_populates="replies",
        remote_side="Comment.id",
        lazy="selectin",
    )
    replies: Mapped[list["Comment"]] = relationship(
        back_populates="parent",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Comment(id={self.id}, image_id={self.image_id}, author_id={self.author_id})>"
