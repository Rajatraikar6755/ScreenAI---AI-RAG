"""
Interview Service — orchestrates the full interview lifecycle.

This is the central coordinator that links all services together:
ResumeService → RAGService → StorageService → QuestionResponse
"""

from datetime import datetime
from fastapi import Request
from app.config import settings
from app.models.session import Session, SessionStatus, SessionCreateRequest, SessionSummary
from app.models.question import Question, Answer, QuestionResponse, AnswerSubmitResponse
from app.models.resume import ResumeData
from app.services.rag_service import RAGService
from app.services.storage_service import StorageService
from app.utils.logger import get_logger

logger = get_logger(__name__)


class SessionNotFoundError(Exception):
    pass


class SessionStateError(Exception):
    pass


class InterviewService:
    """
    Manages the complete interview lifecycle:
    1. Session creation
    2. Starting the interview (first question generation)
    3. Submitting answers and getting follow-up questions
    4. Session completion and summary generation
    """

    def __init__(self, rag_service: RAGService, storage: StorageService):
        self.rag = rag_service
        self.storage = storage

    async def create_session(self, request: SessionCreateRequest) -> dict:
        """
        Create a new interview session from candidate info.
        Persists the session to MongoDB.
        """
        resume_data = ResumeData(
            raw_text=request.resume_text,
            candidate_name=request.candidate_name,
            skills=request.extracted_skills,
            domains=request.extracted_domains,
            experience_years=request.experience_years,
        )

        session = Session(
            candidate_name=request.candidate_name,
            role=request.role,
            resume_data=resume_data.model_dump(),
            status=SessionStatus.CREATED,
            total_questions=settings.MAX_QUESTIONS,
        )

        session_dict = session.model_dump()
        session_dict["created_at"] = datetime.utcnow()

        await self.storage.create_session(session_dict)
        logger.info(f"Session created: {session.id} | {request.role} | {request.candidate_name}")

        return {
            "session_id": session.id,
            "candidate_name": session.candidate_name,
            "role": session.role,
            "status": session.status,
            "total_questions": session.total_questions,
            "message": "Session created. Call /start to begin the interview.",
        }

    async def start_interview(self, session_id: str) -> QuestionResponse:
        """
        Transition session to IN_PROGRESS and generate the first question.
        """
        session = await self._get_session_or_raise(session_id)

        if session["status"] == SessionStatus.COMPLETED:
            raise SessionStateError("This interview session has already been completed.")
        if session["status"] == SessionStatus.IN_PROGRESS:
            # Return the current question if already started
            questions = await self.storage.get_questions_for_session(session_id)
            if questions:
                q = questions[-1]
                return self._build_question_response(q, session)

        # Update session status
        await self.storage.update_session(session_id, {
            "status": SessionStatus.IN_PROGRESS,
            "started_at": datetime.utcnow(),
            "current_question_index": 0,
        })

        resume_data = ResumeData(**session["resume_data"])

        # Generate the first question
        question = await self.rag.generate_question(
            session_id=session_id,
            role=session["role"],
            resume_data=resume_data,
            question_index=0,
            conversation_history=[],
        )

        # Persist the question
        question_dict = question.model_dump()
        question_dict["generated_at"] = question.generated_at
        await self.storage.save_question(question_dict)

        logger.info(f"Interview started: {session_id[:8]} | First question generated")
        return self._build_question_response(question.model_dump(), session)

    async def submit_answer(
        self,
        session_id: str,
        question_id: str,
        answer_text: str,
    ) -> AnswerSubmitResponse:
        """
        Store the candidate's answer and generate the next question (or close the session).
        """
        session = await self._get_session_or_raise(session_id)

        if session["status"] != SessionStatus.IN_PROGRESS:
            raise SessionStateError(f"Session is not in progress (status: {session['status']})")

        # Verify the question belongs to this session
        question = await self.storage.get_question(question_id)
        if not question or question["session_id"] != session_id:
            raise SessionNotFoundError(f"Question {question_id} not found in session {session_id}")

        # Save the answer
        answer = Answer(
            session_id=session_id,
            question_id=question_id,
            answer_text=answer_text,
        )
        answer_dict = answer.model_dump()
        answer_dict["submitted_at"] = datetime.utcnow()
        await self.storage.save_answer(answer_dict)

        current_index = session.get("current_question_index", 0)
        next_index = current_index + 1

        # Check if interview is complete
        if next_index >= session["total_questions"]:
            await self.storage.update_session(session_id, {
                "status": SessionStatus.COMPLETED,
                "completed_at": datetime.utcnow(),
                "current_question_index": next_index,
            })
            logger.info(f"Interview completed: {session_id[:8]}")
            return AnswerSubmitResponse(
                message="Interview complete! Generating your results...",
                session_complete=True,
                session_id=session_id,
            )

        # Fetch conversation history for adaptive context
        qa_pairs = await self.storage.get_qa_pairs(session_id)

        resume_data = ResumeData(**session["resume_data"])

        # Generate next question (adaptive — knows prior Q&A)
        next_question = await self.rag.generate_question(
            session_id=session_id,
            role=session["role"],
            resume_data=resume_data,
            question_index=next_index,
            conversation_history=qa_pairs,
        )

        # Persist next question
        q_dict = next_question.model_dump()
        q_dict["generated_at"] = next_question.generated_at
        await self.storage.save_question(q_dict)

        # Update session progress
        await self.storage.update_session(session_id, {
            "current_question_index": next_index,
        })

        return AnswerSubmitResponse(
            message="Answer recorded. Here is your next question.",
            next_question=self._build_question_response(q_dict, session),
            session_complete=False,
            session_id=session_id,
        )

    async def get_session_summary(self, session_id: str) -> SessionSummary:
        """Generate and return the final interview summary."""
        session = await self._get_session_or_raise(session_id)
        qa_pairs = await self.storage.get_qa_pairs(session_id)
        resume_data = ResumeData(**session["resume_data"])

        analysis = await self.rag.generate_session_summary(
            session_id=session_id,
            role=session["role"],
            resume_data=resume_data,
            qa_pairs=qa_pairs,
        )

        # Calculate duration
        duration = None
        if session.get("started_at") and session.get("completed_at"):
            started = session["started_at"]
            completed = session["completed_at"]
            if isinstance(started, datetime) and isinstance(completed, datetime):
                duration = round((completed - started).total_seconds() / 60, 1)

        return SessionSummary(
            session_id=session_id,
            candidate_name=resume_data.candidate_name,
            role=session["role"],
            total_questions=session["total_questions"],
            questions_answered=len([p for p in qa_pairs if p.get("answer")]),
            duration_minutes=duration,
            overall_assessment=analysis.get("overall_assessment", ""),
            topic_analysis=analysis.get("topic_analysis", []),
            key_strengths=analysis.get("key_strengths", []),
            improvement_areas=analysis.get("improvement_areas", []),
            confidence_score=analysis.get("confidence_score", 0),
            recommendation=analysis.get("recommendation", ""),
            qa_pairs=qa_pairs,
            completed_at=session.get("completed_at", datetime.utcnow()).isoformat() if session.get("completed_at") else None,
        )

    async def get_session(self, session_id: str) -> dict:
        return await self._get_session_or_raise(session_id)

    # ── Private Helpers ───────────────────────────────────────────────────────

    async def _get_session_or_raise(self, session_id: str) -> dict:
        session = await self.storage.get_session(session_id)
        if not session:
            raise SessionNotFoundError(f"Session not found: {session_id}")
        return session

    def _build_question_response(self, q: dict, session: dict) -> QuestionResponse:
        total = session["total_questions"]
        idx = q["order_index"]
        return QuestionResponse(
            question_id=q["id"],
            question_text=q["question_text"],
            topic=q.get("topic", ""),
            difficulty=q.get("difficulty", "conceptual"),
            order_index=idx,
            total_questions=total,
            is_final=(idx >= total),
        )
