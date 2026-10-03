"""Embedding service: generate, store, and search vector embeddings for RAG."""

import logging
from typing import Optional

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.embedding import Embedding
from app.models.image import MedicalImage
from app.services.ai_service import AIService

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for managing vector embeddings used in semantic search and RAG."""

    def __init__(self, ai_service: AIService):
        self.ai_service = ai_service

    async def store_embedding(
        self,
        db: AsyncSession,
        content_type: str,
        content_id: int,
        content_text: str,
        image_id: int,
        metadata_dict: Optional[dict] = None,
    ) -> Embedding | None:
        """
        Generate an embedding for the given text and store it in the database.

        Args:
            db: Database session.
            content_type: Type of content ('annotation', 'comment', 'ai_analysis').
            content_id: ID of the source content record.
            content_text: The text to embed.
            image_id: ID of the associated medical image.
            metadata_dict: Optional metadata for filtered search (modality, body_region, etc.).

        Returns:
            The created Embedding record, or None if embedding generation failed.
        """
        try:
            vector = await self.ai_service.generate_embedding(content_text)

            embedding = Embedding(
                content_type=content_type,
                content_id=content_id,
                content_text=content_text,
                embedding=vector,
                image_id=image_id,
                metadata_json=metadata_dict,
            )
            db.add(embedding)
            await db.flush()
            logger.info(f"Stored embedding for {content_type}:{content_id}")
            return embedding
        except Exception as e:
            logger.error(f"Failed to store embedding for {content_type}:{content_id}: {e}")
            return None

    async def search_similar(
        self,
        db: AsyncSession,
        query_text: str,
        top_k: int = 10,
        modality: Optional[str] = None,
        body_region: Optional[str] = None,
        finding_type: Optional[str] = None,
    ) -> list[dict]:
        """
        Perform semantic similarity search across stored embeddings.

        Args:
            db: Database session.
            query_text: The search query text.
            top_k: Maximum number of results to return.
            modality: Optional filter by image modality.
            body_region: Optional filter by body region.
            finding_type: Optional filter by finding type.

        Returns:
            List of dicts with keys: content_text, content_type, content_id,
            image_id, image_title, image_thumbnail, similarity_score, metadata.
        """
        try:
            query_vector = await self.ai_service.generate_query_embedding(query_text)

            # Build the query with pgvector cosine distance
            # Lower distance = more similar; convert to similarity score
            stmt = (
                select(
                    Embedding,
                    MedicalImage.title.label("image_title"),
                    MedicalImage.thumbnail_path.label("image_thumbnail"),
                    MedicalImage.modality.label("image_modality"),
                    MedicalImage.body_region.label("image_body_region"),
                    Embedding.embedding.cosine_distance(query_vector).label("distance"),
                )
                .join(MedicalImage, Embedding.image_id == MedicalImage.id)
                .order_by(text("distance ASC"))
                .limit(top_k)
            )

            # Apply optional filters via metadata_json
            if modality:
                stmt = stmt.where(MedicalImage.modality == modality)
            if body_region:
                stmt = stmt.where(MedicalImage.body_region.ilike(f"%{body_region}%"))
            if finding_type:
                stmt = stmt.where(
                    Embedding.metadata_json["finding_type"].as_string() == finding_type
                )

            result = await db.execute(stmt)
            rows = result.all()

            return [
                {
                    "content_text": row.Embedding.content_text,
                    "content_type": row.Embedding.content_type,
                    "content_id": row.Embedding.content_id,
                    "image_id": row.Embedding.image_id,
                    "image_title": row.image_title,
                    "image_thumbnail": row.image_thumbnail,
                    "similarity_score": round(1.0 - float(row.distance), 4),
                    "finding_type": (row.Embedding.metadata_json or {}).get("finding_type"),
                    "body_region": row.image_body_region,
                    "modality": row.image_modality,
                }
                for row in rows
            ]
        except Exception as e:
            logger.error(f"Similarity search failed: {e}")
            return []
