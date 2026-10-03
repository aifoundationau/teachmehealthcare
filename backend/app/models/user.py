"""User model with role-based access control."""

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.image import MedicalImage
    from app.models.annotation import Annotation
    from app.models.comment import Comment


class User(Base):
    """
    Represents a user of the TeachMeHealth platform.

    Roles:
        - admin: Full access, can manage users and all content
        - doctor: Can upload images, add annotations, and comment
        - student: Can view images, annotations, and comments; can comment
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="student")
    specialization: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[Optional[datetime]] = mapped_column(onupdate=func.now(), nullable=True)

    # Relationships
    images: Mapped[list["MedicalImage"]] = relationship(back_populates="uploader", cascade="all, delete-orphan")
    annotations: Mapped[list["Annotation"]] = relationship(back_populates="author", cascade="all, delete-orphan")
    comments: Mapped[list["Comment"]] = relationship(back_populates="author", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
