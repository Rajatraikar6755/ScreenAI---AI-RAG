"""
Quick smoke test — validates backend module imports without starting services.
Run: python scripts/test_imports.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

print("Testing backend imports...")

from app.config import settings
print(f"OK Config loaded: GEMINI_MODEL={settings.GEMINI_MODEL}, MAX_QUESTIONS={settings.MAX_QUESTIONS}")

from app.models.resume import ResumeData
from app.models.session import Session, SessionStatus, Role
from app.models.question import Question, Answer, DifficultyLevel
print("OK All Pydantic models import correctly")

from app.rag.document_loader import DocumentLoader, ROLE_KNOWLEDGE_SOURCES
print(f"OK DocumentLoader: {len(ROLE_KNOWLEDGE_SOURCES)} roles configured")

from app.rag.chunker import RecursiveChunker
chunker = RecursiveChunker()
print(f"OK RecursiveChunker: chunk_size={chunker.chunk_size}, overlap={chunker.chunk_overlap}")

from app.rag.vector_store import VectorStoreManager, ROLE_COLLECTIONS
print(f"OK VectorStoreManager: {len(ROLE_COLLECTIONS)} role collections")

from app.rag.prompt_templates import RESUME_EXTRACTION_PROMPT, QUESTION_GENERATION_PROMPT
print("OK Prompt templates loaded")

from app.services.storage_service import StorageService
print("OK StorageService import OK")

from app.services.embedding_service import EmbeddingService, get_embedding_service
print("OK EmbeddingService import OK")

from app.services.llm_service import LLMService, LLMError
print("OK LLMService import OK")

from app.services.resume_service import ResumeService
print("OK ResumeService import OK")

from app.services.rag_service import RAGService, ROLE_DISPLAY_NAMES
print(f"OK RAGService: {len(ROLE_DISPLAY_NAMES)} roles")

from app.services.interview_service import InterviewService, SessionNotFoundError, SessionStateError
print("OK InterviewService import OK")

from app.api.routes import health, resume, sessions, interview
print("OK All API routes import OK")

print("\nAll imports successful! Backend is ready.")
print("\nNext steps:")
print("  1. Start MongoDB: mongod")
print("  2. Run ingestion: python scripts/ingest_knowledge_base.py")
print("  3. Start backend: uvicorn app.main:app --reload")
