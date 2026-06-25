"""Session management endpoints."""
from fastapi import APIRouter, HTTPException, Request
from app.models.session import SessionCreateRequest, SessionCreateResponse, SessionSummary
from app.services.interview_service import InterviewService, SessionNotFoundError
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


@router.post("/create", response_model=SessionCreateResponse)
async def create_session(request: Request, body: SessionCreateRequest):
    """Create a new interview session from parsed resume data and selected role."""
    try:
        svc = _get_interview_service(request)
        result = await svc.create_session(body)
        return SessionCreateResponse(**result)
    except Exception as e:
        logger.error(f"Session creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}")
async def get_session(request: Request, session_id: str):
    """Retrieve session metadata and status."""
    try:
        svc = _get_interview_service(request)
        session = await svc.get_session(session_id)
        # Exclude internal resume text from response
        session_safe = {k: v for k, v in session.items() if k not in ("resume_data",)}
        return session_safe
    except SessionNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}/summary", response_model=SessionSummary)
async def get_session_summary(request: Request, session_id: str):
    """Generate and return the final structured interview summary."""
    try:
        svc = _get_interview_service(request)
        summary = await svc.get_session_summary(session_id)
        return summary
    except SessionNotFoundError:
        raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")
    except Exception as e:
        logger.error(f"Summary generation error for {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def list_sessions(request: Request):
    """List recent sessions (for admin/debug)."""
    storage: StorageService = request.app.state.storage
    sessions = await storage.list_sessions(limit=20)
    return {"sessions": sessions, "count": len(sessions)}
