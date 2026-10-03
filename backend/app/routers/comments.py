"""Comment routes: create and list threaded comments on images."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.models.image import MedicalImage
from app.models.comment import Comment
from app.schemas.comment import CommentCreate, CommentResponse
from app.services.ai_service import ai_service
from app.services.embedding_service import EmbeddingService
from app.utils.dependencies import get_db, get_current_active_user

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Comments"])
embedding_service = EmbeddingService(ai_service)


@router.get("/images/{image_id}/comments", response_model=list[CommentResponse])
async def list_comments(
    image_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    List all comments for a medical image as a threaded tree.

    Returns only top-level comments (parent_id is None) with nested replies.
    """
    # Verify image exists
    img_result = await db.execute(select(MedicalImage).where(MedicalImage.id == image_id))
    if not img_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")

    # Fetch all comments for this image
    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.author), selectinload(Comment.replies).selectinload(Comment.author))
        .where(Comment.image_id == image_id)
        .where(Comment.parent_id.is_(None))  # Top-level only
        .order_by(Comment.created_at.desc())
    )
    comments = result.scalars().all()

    return comments


@router.post("/images/{image_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    image_id: int,
    data: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Create a new comment on a medical image.

    All authenticated users (including students) can comment.
    Supports threading via optional parent_id.
    """
    # Verify image exists
    img_result = await db.execute(
        select(MedicalImage).where(MedicalImage.id == image_id)
    )
    image = img_result.scalar_one_or_none()
    if not image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")

    # Verify parent comment exists if specified
    if data.parent_id:
        parent_result = await db.execute(
            select(Comment).where(Comment.id == data.parent_id, Comment.image_id == image_id)
        )
        if not parent_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent comment not found or belongs to a different image.",
            )

    comment = Comment(
        image_id=image_id,
        author_id=current_user.id,
        parent_id=data.parent_id,
        content=data.content,
    )
    db.add(comment)
    await db.flush()
    await db.refresh(comment)

    # Store embedding for RAG (non-blocking)
    try:
        await embedding_service.store_embedding(
            db=db,
            content_type="comment",
            content_id=comment.id,
            content_text=data.content,
            image_id=image_id,
            metadata_dict={
                "body_region": image.body_region,
                "modality": image.modality,
            },
        )
    except Exception as e:
        logger.warning(f"Failed to generate embedding for comment {comment.id}: {e}")

    return comment
