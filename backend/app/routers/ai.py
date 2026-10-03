"""AI routes: image analysis via Gemini Vision and RAG question-answering."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.image import MedicalImage
from app.schemas.ai import AIAnalysisResponse, RAGQueryRequest, RAGQueryResponse, RAGSource
from app.services.ai_service import ai_service
from app.services.embedding_service import EmbeddingService
from app.services.image_service import get_full_image_path
from app.utils.dependencies import get_db, get_current_active_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["AI Analysis"])
embedding_service = EmbeddingService(ai_service)


@router.post("/analyze/{image_id}", response_model=AIAnalysisResponse)
async def analyze_image(
    image_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Run AI vision analysis on a medical image using Gemini.

    If the image has already been analyzed, returns the cached result.
    Otherwise, sends the image to Gemini Vision, caches the analysis,
    and stores an embedding for RAG search.
    """
    result = await db.execute(
        select(MedicalImage).where(MedicalImage.id == image_id)
    )
    image = result.scalar_one_or_none()

    if not image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")

    # Return cached analysis if available
    if image.ai_analysis:
        return AIAnalysisResponse(
            image_id=image.id,
            analysis=image.ai_analysis,
            cached=True,
        )

    # Run AI analysis
    try:
        full_path = get_full_image_path(image.file_path)
        analysis_text = await ai_service.analyze_image(full_path)
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )

    # Cache the analysis
    image.ai_analysis = analysis_text
    await db.flush()

    # Store embedding for RAG (non-blocking)
    try:
        await embedding_service.store_embedding(
            db=db,
            content_type="ai_analysis",
            content_id=image.id,
            content_text=analysis_text,
            image_id=image.id,
            metadata_dict={
                "body_region": image.body_region,
                "modality": image.modality,
            },
        )
    except Exception as e:
        logger.warning(f"Failed to store AI analysis embedding for image {image.id}: {e}")

    return AIAnalysisResponse(
        image_id=image.id,
        analysis=analysis_text,
        cached=False,
    )


@router.post("/ask", response_model=RAGQueryResponse)
async def ask_ai(
    query: RAGQueryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Ask a medical question using RAG (Retrieval-Augmented Generation).

    The question is embedded, similar annotations/comments are retrieved
    from the knowledge base, and Gemini generates an answer with citations.
    """
    # Search for relevant context
    similar_results = await embedding_service.search_similar(
        db=db,
        query_text=query.question,
        top_k=query.top_k,
        modality=query.modality,
        body_region=query.body_region,
        finding_type=query.finding_type,
    )

    if not similar_results:
        return RAGQueryResponse(
            answer="I don't have enough information in the knowledge base to answer this question yet. "
                   "As more medical images are uploaded and annotated by doctors, the knowledge base will grow. "
                   "Please try a different question or check back later.",
            sources=[],
        )

    # Generate RAG answer
    try:
        answer = await ai_service.rag_query(query.question, similar_results)
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )

    # Format sources
    sources = [
        RAGSource(
            image_id=r["image_id"],
            image_title=r["image_title"],
            content_type=r["content_type"],
            content_text=r["content_text"][:300],  # Truncate for response
            similarity_score=r["similarity_score"],
        )
        for r in similar_results[:5]  # Limit sources in response
    ]

    return RAGQueryResponse(answer=answer, sources=sources)
