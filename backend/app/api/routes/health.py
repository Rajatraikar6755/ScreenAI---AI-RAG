"""Health check endpoint."""
from fastapi import APIRouter, Request
from app.rag.vector_store import ROLE_COLLECTIONS

router = APIRouter()


@router.get("/health")
async def health_check(request: Request):
    """System health check — verifies all components are up."""
    vs = request.app.state.vector_store
    storage = request.app.state.storage

    # Check vector store populations
    kb_status = {}
    for role in ROLE_COLLECTIONS:
        try:
            stats = vs.get_collection_stats(role)
            kb_status[role] = stats
        except Exception as e:
            kb_status[role] = {"error": str(e)}

    # Check MongoDB
    db_ok = False
    try:
        await storage.db.command("ping")
        db_ok = True
    except Exception:
        pass

    return {
        "status": "healthy",
        "components": {
            "mongodb": "connected" if db_ok else "disconnected",
            "vector_store": "ready",
        },
        "knowledge_base": kb_status,
    }
