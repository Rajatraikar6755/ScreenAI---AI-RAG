"""
Chunking strategy for knowledge base documents.

Design decisions:
- chunk_size=800 chars: enough for one concept but not overwhelming for retrieval
- chunk_overlap=150: prevents cutting mid-sentence / mid-concept
- Recursive character splitting: respects paragraph → sentence → word hierarchy
- Metadata preserved per chunk for traceability (source, title, page_num)
"""

import re
from dataclasses import dataclass
from app.rag.document_loader import RawDocument
from app.utils.logger import get_logger

logger = get_logger(__name__)


@dataclass
class DocumentChunk:
    """A single text chunk ready for embedding."""

    chunk_id: str
    text: str
    source: str
    title: str
    page_num: int
    chunk_index: int
    role_tags: list[str]
    char_count: int = 0


class RecursiveChunker:
    """
    Splits documents into semantically coherent chunks.

    Strategy: Split by paragraph breaks first, then sentences, then words.
    This preserves conceptual integrity better than fixed-size splitting.
    """

    def __init__(self, chunk_size: int = 800, chunk_overlap: int = 150):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        # Priority separators: double-newline → single-newline → period → space
        self.separators = ["\n\n", "\n", ". ", " ", ""]

    def chunk_document(self, doc: RawDocument) -> list[DocumentChunk]:
        """Convert a RawDocument into overlapping text chunks with metadata."""
        chunks: list[DocumentChunk] = []
        global_chunk_idx = 0

        for page_data in doc.pages:
            page_text = self._clean_text(page_data["text"])
            page_num = page_data["page_num"]

            page_chunks = self._split_text(page_text)

            for text in page_chunks:
                if len(text.strip()) < 50:
                    continue  # Skip trivially short fragments

                chunk = DocumentChunk(
                    chunk_id=f"{_make_safe_id(doc.title)}_p{page_num}_c{global_chunk_idx}",
                    text=text.strip(),
                    source=doc.source,
                    title=doc.title,
                    page_num=page_num,
                    chunk_index=global_chunk_idx,
                    role_tags=doc.role_tags,
                    char_count=len(text.strip()),
                )
                chunks.append(chunk)
                global_chunk_idx += 1

        logger.info(
            f"  ├─ '{doc.title}': {len(doc.pages)} pages → {len(chunks)} chunks"
        )
        return chunks

    def _split_text(self, text: str) -> list[str]:
        """Recursively split text using separator hierarchy."""
        return self._recursive_split(text, self.separators)

    def _recursive_split(self, text: str, separators: list[str]) -> list[str]:
        if not separators:
            return self._fixed_split(text)

        separator = separators[0]
        remaining_separators = separators[1:]

        if separator == "":
            return self._fixed_split(text)

        parts = text.split(separator)
        result = []
        current = ""

        for part in parts:
            if len(current) + len(separator) + len(part) <= self.chunk_size:
                current = current + separator + part if current else part
            else:
                if current:
                    result.append(current)
                if len(part) > self.chunk_size:
                    # Part too big — recurse with next separator
                    sub_chunks = self._recursive_split(part, remaining_separators)
                    result.extend(sub_chunks)
                    current = ""
                else:
                    current = part

        if current:
            result.append(current)

        # Apply overlap: carry tail of previous chunk into next
        return self._apply_overlap(result)

    def _fixed_split(self, text: str) -> list[str]:
        """Fallback: hard split by character count."""
        chunks = []
        start = 0
        while start < len(text):
            end = start + self.chunk_size
            chunks.append(text[start:end])
            start = end - self.chunk_overlap
        return chunks

    def _apply_overlap(self, chunks: list[str]) -> list[str]:
        """Prepend tail of previous chunk to preserve context across boundaries."""
        if len(chunks) <= 1:
            return chunks
        overlapped = [chunks[0]]
        for i in range(1, len(chunks)):
            prev_tail = chunks[i - 1][-self.chunk_overlap:]
            overlapped.append(prev_tail + " " + chunks[i])
        return overlapped

    def _clean_text(self, text: str) -> str:
        """Normalise whitespace and remove garbage characters."""
        text = re.sub(r"\s+", " ", text)
        text = re.sub(r"[^\x20-\x7E\n]", "", text)
        text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)  # Fix hyphenated line-breaks
        return text.strip()


def _make_safe_id(title: str) -> str:
    return re.sub(r"[^\w]", "_", title)[:30]
