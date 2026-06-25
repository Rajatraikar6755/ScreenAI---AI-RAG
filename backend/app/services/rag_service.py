"""
RAG Service — the core retrieval-augmented generation pipeline orchestrator.

Responsibilities:
1. Construct semantic queries from resume + role
2. Retrieve relevant knowledge base chunks (ChromaDB)
3. Generate grounded interview questions using LLM + context
4. Build adaptive follow-ups based on conversation history
"""

from app.config import settings
from app.rag.vector_store import VectorStoreManager
from app.rag.prompt_templates import (
    QUERY_CONSTRUCTION_PROMPT,
    QUESTION_GENERATION_PROMPT,
    SUMMARY_GENERATION_PROMPT,
)
from app.services.llm_service import LLMService
from app.services.embedding_service import EmbeddingService
from app.models.resume import ResumeData
from app.models.question import Question, DifficultyLevel
from app.models.session import Role
from app.utils.logger import get_logger
import uuid
from datetime import datetime

logger = get_logger(__name__)


DIFFICULTY_PROGRESSION = [
    DifficultyLevel.CONCEPTUAL,
    DifficultyLevel.CONCEPTUAL,
    DifficultyLevel.APPLIED,
    DifficultyLevel.APPLIED,
    DifficultyLevel.SCENARIO,
    DifficultyLevel.APPLIED,
    DifficultyLevel.SCENARIO,
]

ROLE_DISPLAY_NAMES = {
    "ai_ml_engineer": "AI/ML Engineer",
    "backend_engineer": "Backend Engineer",
    "data_scientist": "Data Scientist",
    "frontend_engineer": "Frontend Engineer",
}


class RAGService:
    """
    Orchestrates the full RAG pipeline for question generation.

    Design philosophy:
    - Query construction is LLM-driven (not template-based) for diversity
    - Retrieval is role-filtered with MMR deduplication
    - Questions are grounded: they reference specific retrieved concepts
    - Difficulty escalates progressively through the interview
    """

    def __init__(
        self,
        vector_store: VectorStoreManager,
        llm_service: LLMService,
        embedding_service: EmbeddingService,
    ):
        self.vector_store = vector_store
        self.llm = llm_service
        self.embedder = embedding_service

    async def generate_question(
        self,
        session_id: str,
        role: str,
        resume_data: ResumeData,
        question_index: int,
        conversation_history: list[dict],
    ) -> Question:
        """
        Full pipeline: query construction → retrieval → question generation.

        Args:
            session_id: The active interview session ID
            role: Target role enum value (e.g. "ai_ml_engineer")
            resume_data: Parsed candidate resume
            question_index: Which question this is (0-based)
            conversation_history: List of {question, answer} dicts from prior turns
        """
        difficulty = DIFFICULTY_PROGRESSION[
            min(question_index, len(DIFFICULTY_PROGRESSION) - 1)
        ]
        role_display = ROLE_DISPLAY_NAMES.get(role, role)

        logger.info(
            f"Generating Q{question_index + 1} | role={role_display} | "
            f"difficulty={difficulty} | session={session_id[:8]}..."
        )

        # Step 1: Build semantic queries from candidate profile
        queries = await self._construct_queries(role_display, resume_data)
        logger.debug(f"Constructed {len(queries)} RAG queries")

        # Step 2: Retrieve relevant context from knowledge base
        retrieved_chunks = await self._retrieve_context(role, queries)
        logger.info(f"Retrieved {len(retrieved_chunks)} relevant chunks")

        # Step 3: Generate the question using LLM + context
        question_data = await self._generate_with_llm(
            role=role_display,
            resume_data=resume_data,
            retrieved_chunks=retrieved_chunks,
            conversation_history=conversation_history,
            difficulty=difficulty,
        )

        # Step 4: Build the Question model with full traceability
        return Question(
            id=str(uuid.uuid4()),
            session_id=session_id,
            question_text=question_data.get("question", "Could you describe your experience with this role's core technologies?"),
            topic=question_data.get("topic", "General"),
            difficulty=question_data.get("difficulty", difficulty),
            order_index=question_index + 1,
            rag_context_snippets=[c["text"][:300] for c in retrieved_chunks],
            source_books=list({c["title"] for c in retrieved_chunks}),
            what_to_look_for=question_data.get("what_to_look_for", ""),
            generated_at=datetime.utcnow(),
        )

    async def generate_session_summary(
        self,
        session_id: str,
        role: str,
        resume_data: ResumeData,
        qa_pairs: list[dict],
    ) -> dict:
        """Generate a structured post-interview analysis using the LLM."""
        role_display = ROLE_DISPLAY_NAMES.get(role, role)

        qa_formatted = "\n\n".join(
            [
                f"Q{i+1} [{pair.get('topic', 'General')}]: {pair['question']}\n"
                f"A{i+1}: {pair['answer'] or '(No answer provided)'}"
                for i, pair in enumerate(qa_pairs)
            ]
        )

        prompt = SUMMARY_GENERATION_PROMPT.format(
            candidate_name=resume_data.candidate_name,
            role=role_display,
            experience_years=resume_data.experience_years or "Unknown",
            skills=", ".join(resume_data.skills[:15]),
            qa_pairs=qa_formatted,
        )

        try:
            summary_data = await self.llm.generate_json(prompt, temperature=0.3)
            if isinstance(summary_data, dict):
                return summary_data
        except Exception as e:
            logger.error(f"Summary generation failed: {e}")

        # Fallback summary
        return {
            "overall_assessment": f"Interview completed with {len(qa_pairs)} questions answered.",
            "topic_analysis": [],
            "key_strengths": resume_data.skills[:3],
            "improvement_areas": [],
            "recommendation": "Needs Development",
            "confidence_score": 50,
        }

    # ── Private Methods ────────────────────────────────────────────────────────

    async def _construct_queries(
        self, role_display: str, resume_data: ResumeData
    ) -> list[str]:
        """Use LLM to generate diverse semantic queries for retrieval."""
        prompt = QUERY_CONSTRUCTION_PROMPT.format(
            role=role_display,
            skills=", ".join(resume_data.skills[:10]),
            technologies=", ".join(resume_data.technologies[:10]),
            domains=", ".join(resume_data.domains[:5]) or "General ML/Software",
            experience_years=resume_data.experience_years or "Unknown",
            num_queries=4,
        )

        try:
            queries = await self.llm.generate_json(prompt, temperature=0.5)
            if isinstance(queries, list) and all(isinstance(q, str) for q in queries):
                return queries[:5]  # Cap at 5 queries
        except Exception as e:
            logger.warning(f"LLM query construction failed: {e}. Using fallback queries.")

        # Fallback: construct queries from skills directly
        fallback = [
            f"{role_display} core concepts and algorithms",
            *[f"{skill} technical concepts and applications" for skill in resume_data.skills[:3]],
        ]
        return fallback[:4]

    async def _retrieve_context(
        self, role: str, queries: list[str]
    ) -> list[dict]:
        """Embed queries and retrieve relevant chunks from the vector store."""
        if not queries:
            return []

        # Embed all queries in one batch
        query_embeddings = await self.embedder.encode(queries)

        # Retrieve from ChromaDB
        chunks = self.vector_store.query(
            role=role,
            query_embeddings=query_embeddings,
            top_k=settings.TOP_K_RETRIEVAL,
        )

        return chunks

    async def _generate_with_llm(
        self,
        role: str,
        resume_data: ResumeData,
        retrieved_chunks: list[dict],
        conversation_history: list[dict],
        difficulty: DifficultyLevel,
    ) -> dict:
        """Build the question generation prompt and call the LLM."""
        # Format retrieved context
        if retrieved_chunks:
            context_text = "\n\n---\n\n".join(
                [
                    f"[Source: {c['title']}, Page {c['page_num']}, "
                    f"Relevance: {c['relevance_score']}]\n{c['text']}"
                    for c in retrieved_chunks
                ]
            )
        else:
            context_text = "No specific textbook context retrieved. Use general knowledge."

        # Format conversation history
        if conversation_history:
            history_text = "\n".join(
                [
                    f"Q{i+1}: {h['question']}\nA: {h.get('answer', '(skipped)')}"
                    for i, h in enumerate(conversation_history)
                ]
            )
        else:
            history_text = "This is the first question. No prior context."

        # Build candidate profile string
        candidate_profile = (
            f"Name: {resume_data.candidate_name}\n"
            f"Skills: {', '.join(resume_data.skills[:12])}\n"
            f"Technologies: {', '.join(resume_data.technologies[:10])}\n"
            f"Domains: {', '.join(resume_data.domains[:5]) or 'Not specified'}\n"
            f"Experience: {resume_data.experience_years or 'Unknown'} years\n"
            f"Summary: {resume_data.summary[:300]}"
        )

        prompt = QUESTION_GENERATION_PROMPT.format(
            role=role,
            candidate_profile=candidate_profile,
            retrieved_context=context_text[:4000],  # Token limit guard
            history=history_text[-2000:],
            questions_asked=len(conversation_history),
            difficulty_level=difficulty,
        )

        try:
            result = await self.llm.generate_json(prompt, temperature=0.75)
            if isinstance(result, dict) and "question" in result:
                return result
        except Exception as e:
            logger.error(f"Question generation LLM call failed: {e}")

        # Emergency fallback question
        return {
            "question": f"Can you walk me through how you would approach building a scalable {role} system from scratch?",
            "topic": "System Design",
            "difficulty": "scenario",
            "what_to_look_for": "Architecture thinking and practical experience",
        }
