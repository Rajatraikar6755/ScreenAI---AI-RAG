"""
Knowledge Base Ingestion Script

Run this ONCE before starting the backend to populate ChromaDB with embeddings.

Usage:
    cd backend
    python scripts/ingest_knowledge_base.py

Options:
    --role          Only ingest for a specific role (default: all roles)
    --force         Re-ingest even if collection already has documents
    --brownlee-path Path to the Jason Brownlee PDF (defaults to env var BROWNLEE_PDF_PATH)

Design:
- Downloads public PDFs once, caches locally in ./knowledge_base/
- Chunks text with RecursiveChunker (800 chars, 150 overlap)
- Generates embeddings with sentence-transformers
- Stores in ChromaDB with role-specific collections
"""

import sys
import os
import argparse

# Ensure app package is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from app.config import settings
from app.rag.document_loader import DocumentLoader
from app.rag.chunker import RecursiveChunker
from app.rag.vector_store import VectorStoreManager
from app.services.embedding_service import EmbeddingService
from app.utils.logger import get_logger

logger = get_logger("ingest")


def parse_args():
    parser = argparse.ArgumentParser(description="Ingest knowledge base into ChromaDB")
    parser.add_argument("--role", type=str, default=None, help="Only ingest for this role")
    parser.add_argument("--force", action="store_true", help="Re-ingest even if collection populated")
    parser.add_argument("--brownlee-path", type=str, default=None, help="Path to Jason Brownlee PDF")
    return parser.parse_args()


def main():
    args = parse_args()

    brownlee_path = (
        args.brownlee_path
        or os.environ.get("BROWNLEE_PDF_PATH", "")
        or r"C:\Users\rajat\Downloads\Master Machine Learning Algorithms  Discover how they work and Implement Them From Scratch by Jason Brownlee (z-lib.org).pdf"
    )

    logger.info("=" * 60)
    logger.info("🚀 AI Screening System — Knowledge Base Ingestion")
    logger.info("=" * 60)
    logger.info(f"Knowledge base dir : {settings.KNOWLEDGE_BASE_DIR}")
    logger.info(f"ChromaDB dir       : {settings.CHROMA_PERSIST_DIR}")
    logger.info(f"Embedding model    : {settings.EMBEDDING_MODEL}")
    logger.info(f"Chunk size         : {settings.CHUNK_SIZE}")
    logger.info(f"Chunk overlap      : {settings.CHUNK_OVERLAP}")
    logger.info(f"Brownlee PDF path  : {brownlee_path}")
    logger.info("=" * 60)

    # Initialise components
    loader = DocumentLoader(
        knowledge_base_dir=settings.KNOWLEDGE_BASE_DIR,
        brownlee_pdf_path=brownlee_path,
    )
    chunker = RecursiveChunker(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
    )
    vs = VectorStoreManager(persist_dir=settings.CHROMA_PERSIST_DIR)
    embedder = EmbeddingService()

    ALL_ROLES = ["ai_ml_engineer", "data_scientist", "backend_engineer", "frontend_engineer"]
    roles_to_process = [args.role] if args.role else ALL_ROLES

    for role in roles_to_process:
        logger.info(f"\n{'─' * 50}")
        logger.info(f"📚 Processing role: {role}")

        # Check if already ingested
        if not args.force and vs.collection_exists_and_populated(role):
            count = vs.get_collection_stats(role)["document_count"]
            logger.info(f"   ⏭  Collection already has {count} chunks. Use --force to re-ingest.")
            continue

        # Load documents
        documents = loader.load_for_role(role)
        if not documents:
            logger.warning(f"   ⚠️  No documents loaded for role: {role}")
            continue

        logger.info(f"   📄 Loaded {len(documents)} document(s)")

        # Chunk all documents
        all_chunks = []
        for doc in documents:
            chunks = chunker.chunk_document(doc)
            all_chunks.extend(chunks)

        logger.info(f"   🔪 Total chunks: {len(all_chunks)}")

        if not all_chunks:
            logger.warning("   ⚠️  No chunks produced. Skipping.")
            continue

        # Generate embeddings in batches
        logger.info("   🧠 Generating embeddings...")
        texts = [c.text for c in all_chunks]

        batch_size = 64
        all_embeddings = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            embs = embedder.encode_sync(batch)
            all_embeddings.extend(embs)
            logger.info(f"      Embedded {min(i + batch_size, len(texts))}/{len(texts)} chunks...")

        # Store in ChromaDB
        logger.info("   💾 Storing in ChromaDB...")
        vs.upsert_chunks(role=role, chunks=all_chunks, embeddings=all_embeddings)

        stats = vs.get_collection_stats(role)
        logger.info(f"   ✅ Collection '{stats['collection_name']}' now has {stats['document_count']} chunks")

    logger.info("\n" + "=" * 60)
    logger.info("✅ Ingestion complete!")
    logger.info("   You can now start the backend: uvicorn app.main:app --reload")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
