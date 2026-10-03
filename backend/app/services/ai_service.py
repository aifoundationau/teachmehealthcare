"""AI service: Gemini vision analysis and RAG query engine."""

import logging
from pathlib import Path

import google.generativeai as genai
from PIL import Image

from app.config import settings

logger = logging.getLogger(__name__)

MEDICAL_ANALYSIS_PROMPT = """You are an expert radiologist assistant for educational purposes. Analyze this medical image and provide a structured report:

1. **Image Type**: What type of medical image this is (X-ray, MRI, CT scan, ultrasound, etc.)
2. **Body Region**: What body part or anatomical region is shown
3. **Findings**: List any abnormalities you observe, including:
   - Fractures, dislocations, or bone abnormalities
   - Soft tissue abnormalities
   - Joint space or alignment issues
   - Degenerative changes
   - Any masses, lesions, or other notable findings
4. **Normal Findings**: Note normal structures and anatomy visible
5. **Suggestions**: What a reviewing physician should pay particular attention to
6. **Educational Notes**: Key anatomical landmarks and learning points for medical students

⚠️ IMPORTANT: This analysis is for educational purposes only. Always recommend professional medical review for any clinical decisions. Do not provide definitive diagnoses."""

RAG_SYSTEM_PROMPT = """You are a medical education assistant for the TeachMeHealth platform. You help medical students and professionals understand medical imaging findings.

You have access to a knowledge base of expert-annotated medical images. Use the provided context from real doctor annotations to answer questions accurately.

Guidelines:
- Reference specific cases and annotations when relevant
- Explain medical terminology in an accessible way
- Highlight key diagnostic features and what to look for
- Always note that clinical decisions should involve a qualified physician
- If the context doesn't contain enough information, say so honestly

Context from the knowledge base:
{context}

Answer the following question using the context above. Cite specific cases where relevant."""


class AIService:
    """Service for AI-powered medical image analysis and RAG queries using Google Gemini."""

    def __init__(self):
        """Initialize the Gemini AI client."""
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.vision_model = genai.GenerativeModel("gemini-2.0-flash")
        self.text_model = genai.GenerativeModel("gemini-2.0-flash")

    async def analyze_image(self, image_path: str) -> str:
        """
        Send a medical image to Gemini Vision for analysis.

        Args:
            image_path: Absolute path to the image file on disk.

        Returns:
            Structured analysis text from the AI model.
        """
        try:
            img = Image.open(image_path)
            response = self.vision_model.generate_content(
                [MEDICAL_ANALYSIS_PROMPT, img],
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=2048,
                ),
            )
            return response.text
        except Exception as e:
            logger.error(f"Gemini vision analysis failed: {e}")
            raise RuntimeError(f"AI analysis failed: {str(e)}")

    async def generate_embedding(self, text: str) -> list[float]:
        """
        Generate a 768-dimensional text embedding using Gemini.

        Args:
            text: The text content to embed.

        Returns:
            List of 768 floats representing the embedding vector.
        """
        try:
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document",
            )
            return result["embedding"]
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            raise RuntimeError(f"Embedding generation failed: {str(e)}")

    async def generate_query_embedding(self, text: str) -> list[float]:
        """
        Generate an embedding optimized for query/retrieval.

        Args:
            text: The query text to embed.

        Returns:
            List of 768 floats representing the embedding vector.
        """
        try:
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_query",
            )
            return result["embedding"]
        except Exception as e:
            logger.error(f"Query embedding generation failed: {e}")
            raise RuntimeError(f"Query embedding generation failed: {str(e)}")

    async def rag_query(self, question: str, context_chunks: list[dict]) -> str:
        """
        Answer a question using RAG: combine retrieved context with the question
        and send to Gemini for a comprehensive answer.

        Args:
            question: The user's question.
            context_chunks: List of dicts with keys: content_text, image_title,
                          content_type, similarity_score.

        Returns:
            AI-generated answer with citations to source material.
        """
        try:
            # Build context string from retrieved chunks
            context_parts = []
            for i, chunk in enumerate(context_chunks, 1):
                source_type = chunk.get("content_type", "unknown")
                image_title = chunk.get("image_title", "Unknown Image")
                text = chunk.get("content_text", "")
                score = chunk.get("similarity_score", 0)
                context_parts.append(
                    f"[Source {i}] Image: \"{image_title}\" | Type: {source_type} | "
                    f"Relevance: {score:.2f}\n{text}"
                )

            context_str = "\n\n---\n\n".join(context_parts) if context_parts else "No relevant context found."

            prompt = RAG_SYSTEM_PROMPT.format(context=context_str) + f"\n\nQuestion: {question}"

            response = self.text_model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.4,
                    max_output_tokens=2048,
                ),
            )
            return response.text
        except Exception as e:
            logger.error(f"RAG query failed: {e}")
            raise RuntimeError(f"AI query failed: {str(e)}")


# Singleton instance
ai_service = AIService()
