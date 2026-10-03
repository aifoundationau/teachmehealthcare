"""Pydantic schemas for AI analysis, RAG queries, and search results."""

from typing import Optional

from pydantic import BaseModel


class AIAnalysisResponse(BaseModel):
    """Schema for AI vision analysis response."""
    image_id: int
    analysis: str
    cached: bool


class RAGQueryRequest(BaseModel):
    """Schema for RAG question-answering request."""
    question: str
    modality: Optional[str] = None
    body_region: Optional[str] = None
    finding_type: Optional[str] = None
    top_k: int = 10


class RAGSource(BaseModel):
    """A single source document cited in a RAG response."""
    image_id: int
    image_title: str
    content_type: str
    content_text: str
    similarity_score: float


class RAGQueryResponse(BaseModel):
    """Schema for RAG question-answering response."""
    answer: str
    sources: list[RAGSource]


class SearchResult(BaseModel):
    """Schema for semantic search result."""
    image_id: int
    image_title: str
    image_thumbnail: Optional[str] = None
    content_type: str
    content_text: str
    similarity_score: float
    finding_type: Optional[str] = None
    body_region: Optional[str] = None
    modality: Optional[str] = None
