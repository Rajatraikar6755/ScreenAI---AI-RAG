"""Interview lifecycle endpoints — start, answer, progress."""
from fastapi import APIRouter, HTTPException, Request
from app.models.question import AnswerSubmitRequest, AnswerSubmitResponse, QuestionResponse
from app.services.interview_service import (
    InterviewService,
    SessionNotFoundError,
    SessionStateError,
)
from app.services.rag_service import RAGService
from app.services.storage_service import StorageService
from app.services.llm_service import LLMService
from app.services.embedding_service import get_embedding_service
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


def _get_interview_service(request: Request) -> InterviewService:
    storage: StorageService = request.app.state.storage
    vs = request.app.state.vector_store
    llm = LLMService()
    embedder = get_embedding_service()
    rag = RAGService(vector_store=vs, llm_service=llm, embedding_service=embedder)
    return InterviewService(rag_service=rag, storage=storage)


@router.post("/{session_id}/start", response_model=QuestionResponse)
async def start_interview(request: Request, session_id: str):
    """
    Start the interview for a session.
    Generates and returns the first question.
    """
    try:
        svc = _get_interview_service(request)
        question = await svc.start_interview(session_id)
        return question
    except SessionNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")
    except SessionStateError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        logger.error(f"Start interview error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{session_id}/answer/{question_id}", response_model=AnswerSubmitResponse)
async def submit_answer(
    request: Request,
    session_id: str,
    question_id: str,
    body: AnswerSubmitRequest,
):
    """
    Submit an answer to the current question.
    Returns the next question (or completion signal if done).
    """
    try:
        svc = _get_interview_service(request)
        response = await svc.submit_answer(
            session_id=session_id,
            question_id=question_id,
            answer_text=body.answer_text,
        )
        return response
    except SessionNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except SessionStateError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        logger.error(f"Submit answer error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}/progress")
async def get_progress(request: Request, session_id: str):
    """Return current interview progress (question index, total, status)."""
    try:
        svc = _get_interview_service(request)
        session = await svc.get_session(session_id)
        questions = await svc.storage.get_questions_for_session(session_id)
        answers = await svc.storage.get_answers_for_session(session_id)

        return {
            "session_id": session_id,
            "status": session["status"],
            "current_question_index": session.get("current_question_index", 0),
            "total_questions": session["total_questions"],
            "questions_generated": len(questions),
            "answers_submitted": len(answers),
        }
    except SessionNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
