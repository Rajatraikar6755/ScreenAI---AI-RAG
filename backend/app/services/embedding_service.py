"""
Embedding service using sentence-transformers.

Singleton pattern ensures the model is loaded only once (expensive operation).
Wraps the model with async-compatible interface using thread pooling.
"""

import asyncio
from functools import lru_cache
from sentence_transformers import SentenceTransformer
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


class EmbeddingService:
    """
    Generates dense vector embeddings for text using sentence-transformers.

    Model: all-MiniLM-L6-v2
    - Dimension: 384
    - Fast inference (50ms per batch on CPU)
    - Strong semantic similarity for technical text
    - Open-source, no API cost
    """

    _instance: "EmbeddingService | None" = None
    _model: SentenceTransformer | None = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def _load_model(self) -> None:
        if self._model is None:
            logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}...")
            self._model = SentenceTransformer(settings.EMBEDDING_MODEL)
            logger.info("✅ Embedding model loaded")

    def encode_sync(self, texts: list[str]) -> list[list[float]]:
        """Synchronous encoding — use for batch ingestion."""
        self._load_model()
        embeddings = self._model.encode(texts, show_progress_bar=False, batch_size=32)
        return embeddings.tolist()

    async def encode(self, texts: list[str]) -> list[list[float]]:
        """Async-safe encoding using thread executor."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.encode_sync, texts)

    async def encode_single(self, text: str) -> list[float]:
        """Convenience wrapper for encoding a single string."""
        results = await self.encode([text])
        return results[0]


@lru_cache()
def get_embedding_service() -> EmbeddingService:
    """Dependency injection provider — returns singleton."""
    return EmbeddingService()
