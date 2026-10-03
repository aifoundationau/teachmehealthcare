"""Pydantic schemas for TeachMeHealth."""

from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.schemas.image import ImageCreate, ImageResponse, ImageListResponse
from app.schemas.annotation import AnnotationCreate, AnnotationUpdate, AnnotationResponse
from app.schemas.comment import CommentCreate, CommentResponse
from app.schemas.ai import AIAnalysisResponse, RAGQueryRequest, RAGQueryResponse, SearchResult

__all__ = [
    "UserCreate", "UserLogin", "UserResponse", "Token",
    "ImageCreate", "ImageResponse", "ImageListResponse",
    "AnnotationCreate", "AnnotationUpdate", "AnnotationResponse",
    "CommentCreate", "CommentResponse",
    "AIAnalysisResponse", "RAGQueryRequest", "RAGQueryResponse", "SearchResult",
]
