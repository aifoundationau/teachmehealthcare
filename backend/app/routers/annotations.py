"""Annotation routes: create, list, update, and delete annotations on images."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.models.image import MedicalImage
from app.models.annotation import Annotation
from app.schemas.annotation import AnnotationCreate, AnnotationUpdate, AnnotationResponse
from app.services.ai_service import ai_service
from app.services.embedding_service import EmbeddingService
from app.utils.dependencies import get_db, get_current_active_user
from app.utils.roles import require_doctor

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Annotations"])
embedding_service = EmbeddingService(ai_service)


@router.get("/images/{image_id}/annotations", response_model=list[AnnotationResponse])
async def list_annotations(
    image_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all annotations for a specific medical image."""
    # Verify image exists
    img_result = await db.execute(select(MedicalImage).where(MedicalImage.id == image_id))
    if not img_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")

    result = await db.execute(
        select(Annotation)
        .options(selectinload(Annotation.author))
        .where(Annotation.image_id == image_id)
        .order_by(Annotation.created_at.desc())
    )
    return result.scalars().all()


@router.post("/images/{image_id}/annotations", response_model=AnnotationResponse, status_code=status.HTTP_201_CREATED)
async def create_annotation(
    image_id: int,
    data: AnnotationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_doctor),
):
    """
    Create a new annotation on a medical image.

    Requires doctor or admin role. After creation, generates and stores
    a vector embedding for RAG search.
    """
    # Verify image exists
    img_result = await db.execute(
        select(MedicalImage).where(MedicalImage.id == image_id)
    )
    image = img_result.scalar_one_or_none()
    if not image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")

    # Validate finding_type
    valid_types = {
        "fracture", "dislocation", "ligament_tear", "soft_tissue",
        "degenerative", "tumor", "infection", "normal", "other",
    }
    if data.finding_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid finding_type. Must be one of: {', '.join(sorted(valid_types))}",
        )

    annotation = Annotation(
        image_id=image_id,
        author_id=current_user.id,
        finding_type=data.finding_type,
        finding_description=data.finding_description,
        severity=data.severity,
        location_on_image=data.location_on_image,
        clinical_notes=data.clinical_notes,
    )
    db.add(annotation)
    await db.flush()
    await db.refresh(annotation)

    # Store embedding for RAG (non-blocking — if it fails, annotation still saved)
    embed_text = (
        f"Finding: {data.finding_type}. "
        f"Description: {data.finding_description}. "
        f"Location: {data.location_on_image or 'unspecified'}. "
        f"Severity: {data.severity or 'unspecified'}. "
        f"Clinical notes: {data.clinical_notes or 'none'}."
    )
    try:
        await embedding_service.store_embedding(
            db=db,
            content_type="annotation",
            content_id=annotation.id,
            content_text=embed_text,
            image_id=image_id,
            metadata_dict={
                "finding_type": data.finding_type,
                "body_region": image.body_region,
                "modality": image.modality,
            },
        )
    except Exception as e:
        logger.warning(f"Failed to generate embedding for annotation {annotation.id}: {e}")

    return annotation


@router.put("/annotations/{annotation_id}", response_model=AnnotationResponse)
async def update_annotation(
    annotation_id: int,
    data: AnnotationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update an existing annotation. Only the original author can update."""
    result = await db.execute(
        select(Annotation)
        .options(selectinload(Annotation.author))
        .where(Annotation.id == annotation_id)
    )
    annotation = result.scalar_one_or_none()

    if not annotation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Annotation not found")

    if annotation.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own annotations.",
        )

    # Update only provided fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(annotation, field, value)

    await db.flush()
    await db.refresh(annotation)
    return annotation


@router.delete("/annotations/{annotation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_annotation(
    annotation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete an annotation. Only the author or admin can delete."""
    result = await db.execute(
        select(Annotation).where(Annotation.id == annotation_id)
    )
    annotation = result.scalar_one_or_none()

    if not annotation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Annotation not found")

    if annotation.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own annotations.",
        )

    await db.delete(annotation)
