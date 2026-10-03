"""Medical image routes: upload, list, detail, and delete."""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Optional

from app.models.user import User
from app.models.image import MedicalImage
from app.models.annotation import Annotation
from app.models.comment import Comment
from app.schemas.image import ImageResponse, ImageListResponse
from app.services.image_service import save_upload_file, delete_image_files
from app.utils.dependencies import get_db, get_current_active_user
from app.utils.roles import require_doctor

router = APIRouter(prefix="/images", tags=["Medical Images"])


@router.get("/", response_model=list[ImageListResponse])
async def list_images(
    modality: Optional[str] = Query(None, description="Filter by modality (xray, mri, ct, etc.)"),
    body_region: Optional[str] = Query(None, description="Filter by body region"),
    uploaded_by: Optional[int] = Query(None, description="Filter by uploader user ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List medical images with optional filters and pagination."""
    stmt = select(MedicalImage).options(selectinload(MedicalImage.uploader))

    if modality:
        stmt = stmt.where(MedicalImage.modality == modality)
    if body_region:
        stmt = stmt.where(MedicalImage.body_region.ilike(f"%{body_region}%"))
    if uploaded_by:
        stmt = stmt.where(MedicalImage.uploaded_by == uploaded_by)

    stmt = stmt.order_by(MedicalImage.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    images = result.scalars().all()

    # Build response with counts
    responses = []
    for img in images:
        # Get annotation count
        ann_count_result = await db.execute(
            select(func.count(Annotation.id)).where(Annotation.image_id == img.id)
        )
        ann_count = ann_count_result.scalar() or 0

        # Get comment count
        com_count_result = await db.execute(
            select(func.count(Comment.id)).where(Comment.image_id == img.id)
        )
        com_count = com_count_result.scalar() or 0

        responses.append(
            ImageListResponse(
                id=img.id,
                title=img.title,
                thumbnail_path=img.thumbnail_path,
                modality=img.modality,
                body_region=img.body_region,
                created_at=img.created_at,
                uploader_name=img.uploader.full_name if img.uploader else "Unknown",
                annotation_count=ann_count,
                comment_count=com_count,
            )
        )

    return responses


@router.post("/", response_model=ImageResponse, status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    title: str = Form(...),
    modality: str = Form(...),
    body_region: str = Form(...),
    description: Optional[str] = Form(None),
    is_anonymized: bool = Form(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_doctor),
):
    """
    Upload a new medical image.

    Requires doctor or admin role. Accepts multipart form data
    with the image file and metadata fields.
    """
    # Validate modality
    valid_modalities = {"xray", "mri", "ct", "ultrasound", "other"}
    if modality not in valid_modalities:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid modality. Must be one of: {', '.join(sorted(valid_modalities))}",
        )

    # Save the file and generate thumbnail
    file_path, thumbnail_path = await save_upload_file(file)

    # Create database record
    image = MedicalImage(
        title=title,
        description=description,
        file_path=file_path,
        thumbnail_path=thumbnail_path,
        modality=modality,
        body_region=body_region,
        uploaded_by=current_user.id,
        is_anonymized=is_anonymized,
    )
    db.add(image)
    await db.flush()
    await db.refresh(image)

    return ImageResponse(
        id=image.id,
        title=image.title,
        description=image.description,
        file_path=image.file_path,
        thumbnail_path=image.thumbnail_path,
        modality=image.modality,
        body_region=image.body_region,
        uploaded_by=image.uploaded_by,
        is_anonymized=image.is_anonymized,
        ai_analysis=image.ai_analysis,
        created_at=image.created_at,
        uploader=image.uploader,
        annotation_count=0,
        comment_count=0,
    )


@router.get("/{image_id}", response_model=ImageResponse)
async def get_image(
    image_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get full details of a single medical image."""
    result = await db.execute(
        select(MedicalImage)
        .options(selectinload(MedicalImage.uploader))
        .where(MedicalImage.id == image_id)
    )
    image = result.scalar_one_or_none()

    if not image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")

    # Get counts
    ann_count = (await db.execute(
        select(func.count(Annotation.id)).where(Annotation.image_id == image.id)
    )).scalar() or 0

    com_count = (await db.execute(
        select(func.count(Comment.id)).where(Comment.image_id == image.id)
    )).scalar() or 0

    return ImageResponse(
        id=image.id,
        title=image.title,
        description=image.description,
        file_path=image.file_path,
        thumbnail_path=image.thumbnail_path,
        modality=image.modality,
        body_region=image.body_region,
        uploaded_by=image.uploaded_by,
        is_anonymized=image.is_anonymized,
        ai_analysis=image.ai_analysis,
        created_at=image.created_at,
        uploader=image.uploader,
        annotation_count=ann_count,
        comment_count=com_count,
    )


@router.delete("/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_image(
    image_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a medical image. Only the owner or an admin can delete."""
    result = await db.execute(
        select(MedicalImage).where(MedicalImage.id == image_id)
    )
    image = result.scalar_one_or_none()

    if not image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")

    if image.uploaded_by != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own images.",
        )

    # Delete files from disk
    delete_image_files(image.file_path, image.thumbnail_path)

    # Delete from database (cascades to annotations, comments)
    await db.delete(image)
