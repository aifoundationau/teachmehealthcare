"""Search routes: semantic search across the medical knowledge base."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.models.user import User
from app.schemas.ai import SearchResult
from app.services.ai_service import ai_service
from app.services.embedding_service import EmbeddingService
from app.utils.dependencies import get_db, get_current_active_user

router = APIRouter(prefix="/search", tags=["Search"])
embedding_service = EmbeddingService(ai_service)


@router.get("/", response_model=list[SearchResult])
async def semantic_search(
    q: str = Query(..., min_length=2, description="Search query"),
    modality: Optional[str] = Query(None, description="Filter by modality"),
    body_region: Optional[str] = Query(None, description="Filter by body region"),
    finding_type: Optional[str] = Query(None, description="Filter by finding type"),
    top_k: int = Query(20, ge=1, le=50, description="Number of results"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Semantic search across all annotations, comments, and AI analyses.

    Uses pgvector cosine similarity to find the most relevant content
    matching the search query, with optional filters.
    """
    results = await embedding_service.search_similar(
        db=db,
        query_text=q,
        top_k=top_k,
        modality=modality,
        body_region=body_region,
        finding_type=finding_type,
    )

    return [
        SearchResult(
            image_id=r["image_id"],
            image_title=r["image_title"],
            image_thumbnail=r.get("image_thumbnail"),
            content_type=r["content_type"],
            content_text=r["content_text"],
            similarity_score=r["similarity_score"],
            finding_type=r.get("finding_type"),
            body_region=r.get("body_region"),
            modality=r.get("modality"),
        )
        for r in results
    ]
