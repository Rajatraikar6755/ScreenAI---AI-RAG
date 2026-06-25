"""
PDF/text document loader for knowledge base ingestion.
Supports loading from local file paths and remote URLs.
"""

import os
import re
import requests
import fitz  # PyMuPDF
from pathlib import Path
from dataclasses import dataclass, field
from app.utils.logger import get_logger

logger = get_logger(__name__)


@dataclass
class RawDocument:
    """Represents a loaded document before chunking."""

    source: str              # file path or URL
    title: str               # Book/document title
    pages: list[dict]        # [{page_num, text}]
    role_tags: list[str]     # Which roles this doc is relevant to
    total_chars: int = 0


# We now auto-discover PDFs in the knowledge_base directory instead of hardcoding URLs
UNIVERSAL_SOURCES = []


class DocumentLoader:
    """Loads PDFs from local paths or URLs into RawDocument objects."""

    def __init__(self, knowledge_base_dir: str, brownlee_pdf_path: str | None = None):
        self.kb_dir = Path(knowledge_base_dir)
        self.kb_dir.mkdir(parents=True, exist_ok=True)
        self.brownlee_pdf_path = brownlee_pdf_path or os.environ.get("BROWNLEE_PDF_PATH", "")

    def load_for_role(self, role: str) -> list[RawDocument]:
        """Load all PDF documents from the knowledge_base directory."""
        documents: list[RawDocument] = []
        
        # Scan the directory for any .pdf files
        pdf_files = list(self.kb_dir.glob("*.pdf"))
        
        if not pdf_files:
            logger.warning(f"No PDFs found in {self.kb_dir}. Please place PDF files in this folder.")
            return []

        for pdf_path in pdf_files:
            try:
                # The title will just be the filename without the extension
                title = pdf_path.stem
                doc = self._load_from_local(str(pdf_path), title, [role])

                if doc:
                    documents.append(doc)
                    logger.info(f"✅ Loaded '{doc.title}' ({len(doc.pages)} pages, {doc.total_chars} chars)")

            except Exception as e:
                logger.error(f"❌ Failed to load {pdf_path.name}: {e}")

        return documents

    def _load_from_url(self, url: str, title: str, role_tags: list[str]) -> RawDocument | None:
        """Download a PDF from a URL, cache it locally, then extract text."""
        safe_name = re.sub(r"[^\w\-_]", "_", title)[:60] + ".pdf"
        local_path = self.kb_dir / safe_name

        if not local_path.exists():
            logger.info(f"📥 Downloading: {title}")
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            import urllib3
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
            resp = requests.get(url, headers=headers, timeout=60, stream=True, verify=False)
            resp.raise_for_status()
            with open(local_path, "wb") as f:
                for chunk in resp.iter_content(chunk_size=8192):
                    f.write(chunk)
            logger.info(f"💾 Saved to {local_path}")
        else:
            logger.info(f"📂 Using cached: {local_path}")

        return self._load_from_local(str(local_path), title, role_tags)

    def _load_from_local(self, path: str, title: str, role_tags: list[str]) -> RawDocument | None:
        """Extract text from a local PDF file page-by-page."""
        doc = fitz.open(path)
        pages = []
        total_chars = 0

        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text("text").strip()
            # Skip near-empty pages (cover, blank pages)
            if len(text) > 100:
                pages.append({"page_num": page_num + 1, "text": text})
                total_chars += len(text)

        doc.close()

        if not pages:
            logger.warning(f"⚠️  No usable text extracted from {path}")
            return None

        return RawDocument(
            source=path,
            title=title,
            pages=pages,
            role_tags=role_tags,
            total_chars=total_chars,
        )
