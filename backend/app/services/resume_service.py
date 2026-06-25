"""
Resume Service — parses PDF/text resumes and extracts structured candidate data.

Pipeline:
1. Extract raw text from PDF using PyMuPDF
2. Clean and normalise the text
3. Use LLM to extract structured information (skills, domains, experience, etc.)
"""

import re
import json
import fitz  # PyMuPDF
from fastapi import UploadFile
from app.models.resume import ResumeData
from app.services.llm_service import LLMService
from app.rag.prompt_templates import RESUME_EXTRACTION_PROMPT
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ResumeService:
    """Handles resume upload, text extraction, and structured data extraction."""

    def __init__(self, llm_service: LLMService):
        self.llm = llm_service

    async def parse_resume(self, file: UploadFile) -> ResumeData:
        """
        Full resume processing pipeline:
        1. Extract text from PDF or plain text
        2. Clean the text
        3. Use LLM to extract structured fields
        """
        content = await file.read()
        filename = file.filename or ""

        if filename.lower().endswith(".pdf"):
            raw_text = self._extract_pdf_text(content)
        else:
            raw_text = content.decode("utf-8", errors="ignore")

        raw_text = self._clean_text(raw_text)

        if len(raw_text) < 50:
            raise ValueError("Resume appears to be empty or unreadable.")

        logger.info(f"Extracted {len(raw_text)} chars from resume '{filename}'")

        # Use LLM to extract structured information
        extracted = await self._extract_with_llm(raw_text)

        return ResumeData(
            raw_text=raw_text,
            candidate_name=extracted.get("candidate_name", "Candidate"),
            email=extracted.get("email"),
            phone=extracted.get("phone"),
            skills=extracted.get("skills", []),
            technologies=extracted.get("technologies", []),
            domains=extracted.get("domains", []),
            experience_years=extracted.get("experience_years"),
            education=extracted.get("education", []),
            previous_roles=extracted.get("previous_roles", []),
            projects=extracted.get("projects", []),
            summary=extracted.get("summary", ""),
        )

    def _extract_pdf_text(self, content: bytes) -> str:
        """Extract all text from a PDF byte stream."""
        doc = fitz.open(stream=content, filetype="pdf")
        pages = []
        for page in doc:
            text = page.get_text("text")
            if text.strip():
                pages.append(text)
        doc.close()
        return "\n".join(pages)

    def _clean_text(self, text: str) -> str:
        """Normalise whitespace and encoding artefacts."""
        text = re.sub(r"\s+", " ", text)
        text = re.sub(r"[^\x20-\x7E\n]", " ", text)
        return text.strip()

    async def _extract_with_llm(self, resume_text: str) -> dict:
        """Use the LLM to extract structured resume data."""
        # Truncate to avoid context window limits
        truncated = resume_text[:8000]
        prompt = RESUME_EXTRACTION_PROMPT.format(resume_text=truncated)

        try:
            result = await self.llm.generate_json(prompt, temperature=0.1)
            if isinstance(result, dict):
                return result
        except Exception as e:
            logger.warning(f"LLM extraction failed, falling back to regex: {e}")

        # Fallback: basic regex extraction
        return self._regex_fallback(resume_text)

    def _regex_fallback(self, text: str) -> dict:
        """Basic pattern-matching fallback when LLM fails."""
        email_match = re.search(r"[\w.+-]+@[\w-]+\.[a-z]{2,}", text, re.I)
        phone_match = re.search(r"\+?\d[\d\s\-().]{7,}\d", text)

        # Extract common tech skills
        tech_keywords = [
            "Python", "Java", "JavaScript", "TypeScript", "Go", "Rust", "C++",
            "TensorFlow", "PyTorch", "scikit-learn", "Keras", "FastAPI", "Django",
            "Flask", "React", "Next.js", "Node.js", "SQL", "MongoDB", "PostgreSQL",
            "Docker", "Kubernetes", "AWS", "GCP", "Azure", "Git", "Linux",
            "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "MLOps",
        ]
        found_skills = [kw for kw in tech_keywords if re.search(rf"\b{re.escape(kw)}\b", text, re.I)]

        return {
            "candidate_name": "Candidate",
            "email": email_match.group(0) if email_match else None,
            "phone": phone_match.group(0).strip() if phone_match else None,
            "skills": found_skills,
            "technologies": found_skills,
            "domains": [],
            "experience_years": None,
            "education": [],
            "previous_roles": [],
            "projects": [],
            "summary": f"Candidate with skills in: {', '.join(found_skills[:5])}",
        }
