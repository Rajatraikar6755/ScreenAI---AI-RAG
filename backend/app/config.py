"""
Application configuration using Pydantic Settings.
All config values are loaded from environment variables or .env file.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache
import os


class Settings(BaseSettings):
    # ── LLM ─────────────────────────────────────────────────────────────────────
    GITHUB_TOKEN: str = Field(..., description="GitHub Models API key")
    OPENAI_MODEL: str = Field(default="gpt-4o", description="OpenAI model name")

    # ── MongoDB ──────────────────────────────────────────────────────────────────
    MONGODB_URI: str = Field(default="mongodb://localhost:27017")
    MONGODB_DB_NAME: str = Field(default="screening_db")

    # ── ChromaDB ─────────────────────────────────────────────────────────────────
    CHROMA_PERSIST_DIR: str = Field(default="./chroma_db")
    CHROMA_COLLECTION_PREFIX: str = Field(default="kb_role_")

    # ── Knowledge Base ───────────────────────────────────────────────────────────
    KNOWLEDGE_BASE_DIR: str = Field(default="./knowledge_base")

    # ── Embedding ────────────────────────────────────────────────────────────────
    EMBEDDING_MODEL: str = Field(default="all-MiniLM-L6-v2")

    # ── Chunking Strategy ────────────────────────────────────────────────────────
    CHUNK_SIZE: int = Field(default=800, description="Token size per chunk")
    CHUNK_OVERLAP: int = Field(default=150, description="Overlap between chunks")

    # ── Retrieval ────────────────────────────────────────────────────────────────
    TOP_K_RETRIEVAL: int = Field(default=5, description="Number of chunks to retrieve")

    # ── Interview ────────────────────────────────────────────────────────────────
    MAX_QUESTIONS: int = Field(default=7)
    MIN_QUESTIONS: int = Field(default=5)

    # ── App ──────────────────────────────────────────────────────────────────────
    APP_HOST: str = Field(default="0.0.0.0")
    APP_PORT: int = Field(default=8000)
    FRONTEND_URL: str = Field(default="http://localhost:3000")
    DEBUG: bool = Field(default=False)
    LOG_LEVEL: str = Field(default="INFO")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Cached settings loader — call this everywhere."""
    return Settings()


settings = get_settings()
