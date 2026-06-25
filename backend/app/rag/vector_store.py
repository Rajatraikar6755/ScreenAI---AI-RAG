"""
ChromaDB vector store interface.

Design decisions:
- One ChromaDB collection per role (allows role-specific retrieval without metadata filtering overhead)
- Cosine similarity for semantic matching (better than L2 for text embeddings)
- Persistent client: survives restarts, no re-ingestion needed
"""

import chromadb
from chromadb.config import Settings as ChromaSettings
from app.rag.chunker import DocumentChunk
from app.utils.logger import get_logger

logger = get_logger(__name__)

ROLE_COLLECTIONS = {
    "ai_ml_engineer": "kb_ai_ml_engineer",
    "data_scientist": "kb_data_scientist",
    "backend_engineer": "kb_backend_engineer",
    "frontend_engineer": "kb_frontend_engineer",
}


class VectorStoreManager:
    """
    Manages ChromaDB collections for role-specific knowledge bases.
    Each role maps to its own collection to enable clean, filtered retrieval.
    """

    def __init__(self, persist_dir: str):
        self.client = chromadb.PersistentClient(
            path=persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        self._collections: dict[str, chromadb.Collection] = {}
        logger.info(f"ChromaDB initialised at: {persist_dir}")

    def get_collection(self, role: str) -> chromadb.Collection:
        """Get or create the collection for a given role."""
        col_name = ROLE_COLLECTIONS.get(role, f"kb_{role}")
        if col_name not in self._collections:
            self._collections[col_name] = self.client.get_or_create_collection(
                name=col_name,
                metadata={"hnsw:space": "cosine"},
            )
        return self._collections[col_name]

    def collection_exists_and_populated(self, role: str) -> bool:
        """Check whether a role collection has any documents."""
        try:
            col = self.get_collection(role)
            return col.count() > 0
        except Exception:
            return False

    def upsert_chunks(
        self,
        role: str,
        chunks: list[DocumentChunk],
        embeddings: list[list[float]],
    ) -> None:
        """Insert/update chunks with their embeddings into the role collection."""
        if not chunks:
            return

        col = self.get_collection(role)

        ids = [c.chunk_id for c in chunks]
        documents = [c.text for c in chunks]
        metadatas = [
            {
                "source": c.source,
                "title": c.title,
                "page_num": c.page_num,
                "chunk_index": c.chunk_index,
                "role_tags": ",".join(c.role_tags),
                "char_count": c.char_count,
            }
            for c in chunks
        ]

        # Batch upsert in groups of 100 to avoid memory spikes
        batch_size = 100
        for i in range(0, len(chunks), batch_size):
            col.upsert(
                ids=ids[i : i + batch_size],
                embeddings=embeddings[i : i + batch_size],
                documents=documents[i : i + batch_size],
                metadatas=metadatas[i : i + batch_size],
            )
        logger.info(f"  ✅ Upserted {len(chunks)} chunks into collection '{col.name}'")

    def query(
        self,
        role: str,
        query_embeddings: list[list[float]],
        top_k: int = 5,
    ) -> list[dict]:
        """
        Retrieve top-K most relevant chunks for a list of query embeddings.
        Uses MMR-inspired deduplication: keeps unique, diverse results.
        """
        col = self.get_collection(role)

        if col.count() == 0:
            logger.warning(f"Collection for role '{role}' is empty. Run ingestion first.")
            return []

        results = col.query(
            query_embeddings=query_embeddings,
            n_results=min(top_k, col.count()),
            include=["documents", "metadatas", "distances"],
        )

        seen_texts: set[str] = set()
        retrieved: list[dict] = []

        for i, (doc, meta, dist) in enumerate(
            zip(
                results["documents"][0],
                results["metadatas"][0],
                results["distances"][0],
            )
        ):
            # Deduplicate by first 100 chars to avoid near-duplicate chunks
            key = doc[:100]
            if key in seen_texts:
                continue
            seen_texts.add(key)

            retrieved.append(
                {
                    "text": doc,
                    "title": meta.get("title", ""),
                    "source": meta.get("source", ""),
                    "page_num": meta.get("page_num", 0),
                    "relevance_score": round(1 - dist, 4),  # cosine distance → similarity
                }
            )

        return retrieved

    def get_collection_stats(self, role: str) -> dict:
        """Return stats about the collection (useful for health checks)."""
        col = self.get_collection(role)
        return {
            "role": role,
            "collection_name": col.name,
            "document_count": col.count(),
        }
