"""
FastAPI application entry point.
Configures the app, registers routers, and sets up lifespan events.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.utils.logger import get_logger
from app.api.routes import health, resume, interview, sessions
from app.services.storage_service import StorageService
from app.rag.vector_store import VectorStoreManager

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup / shutdown lifecycle manager.
    Initialises DB connections and vector store on startup,
    tears them down gracefully on shutdown.
    """
    logger.info("🚀 Starting AI Screening System backend...")

    # Initialise MongoDB connection
    storage = StorageService()
    await storage.connect()
    app.state.storage = storage
    logger.info("✅ MongoDB connected")

    # Initialise ChromaDB (vector store already persisted on disk)
    vs_manager = VectorStoreManager(persist_dir=settings.CHROMA_PERSIST_DIR)
    app.state.vector_store = vs_manager
    logger.info("✅ ChromaDB vector store initialised")

    yield

    # ── Shutdown ──────────────────────────────────────────────────────────────
    await storage.disconnect()
    logger.info("👋 Shutdown complete")


def create_app() -> FastAPI:
    app = FastAPI(
        title="AI Candidate Screening System",
        description=(
            "Role-based, RAG-powered dynamic technical interview platform. "
            "Generates grounded, candidate-specific interview questions from "
            "ML/CS textbook corpora."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ───────────────────────────────────────────────────────────────
    app.include_router(health.router, prefix="/api", tags=["Health"])
    app.include_router(resume.router, prefix="/api/resume", tags=["Resume"])
    app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"])
    app.include_router(interview.router, prefix="/api/interview", tags=["Interview"])

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
