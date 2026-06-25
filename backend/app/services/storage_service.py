"""
Storage Service — async MongoDB interface using Motor.

Provides typed CRUD operations for all collections:
- sessions
- questions
- answers

Design: thin repository layer — no business logic here.
"""

from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


class StorageService:
    """Async MongoDB repository for all interview data."""

    def __init__(self):
        self._client: AsyncIOMotorClient | None = None
        self._db: AsyncIOMotorDatabase | None = None

    async def connect(self) -> None:
        """Establish MongoDB connection and ensure indexes."""
        self._client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
        self._db = self._client[settings.MONGODB_DB_NAME]
        await self._ensure_indexes()
        logger.info(f"MongoDB connected: {settings.MONGODB_URI}/{settings.MONGODB_DB_NAME}")

    async def disconnect(self) -> None:
        if self._client:
            self._client.close()
            logger.info("MongoDB disconnected")

    @property
    def db(self) -> AsyncIOMotorDatabase:
        if self._db is None:
            raise RuntimeError("StorageService not connected. Call connect() first.")
        return self._db

    # ── Index Setup ───────────────────────────────────────────────────────────

    async def _ensure_indexes(self) -> None:
        """Create indexes for efficient querying."""
        await self.db["sessions"].create_index([("id", ASCENDING)], unique=True)
        await self.db["sessions"].create_index([("created_at", DESCENDING)])
        await self.db["questions"].create_index([("session_id", ASCENDING), ("order_index", ASCENDING)])
        await self.db["answers"].create_index([("session_id", ASCENDING), ("question_id", ASCENDING)])
        logger.debug("MongoDB indexes ensured")

    # ── Session CRUD ──────────────────────────────────────────────────────────

    async def create_session(self, session_data: dict) -> str:
        """Insert a new session document. Returns the session ID."""
        result = await self.db["sessions"].insert_one(session_data)
        return session_data["id"]

    async def get_session(self, session_id: str) -> dict | None:
        """Fetch a session by its UUID."""
        return await self.db["sessions"].find_one({"id": session_id}, {"_id": 0})

    async def update_session(self, session_id: str, updates: dict) -> None:
        """Apply partial updates to a session document."""
        await self.db["sessions"].update_one(
            {"id": session_id},
            {"$set": updates},
        )

    async def list_sessions(self, limit: int = 50) -> list[dict]:
        """Return recent sessions (for admin/debug view)."""
        cursor = self.db["sessions"].find({}, {"_id": 0}).sort("created_at", DESCENDING).limit(limit)
        return await cursor.to_list(length=limit)

    # ── Question CRUD ─────────────────────────────────────────────────────────

    async def save_question(self, question_data: dict) -> str:
        """Persist a generated question document."""
        await self.db["questions"].insert_one(question_data)
        return question_data["id"]

    async def get_questions_for_session(self, session_id: str) -> list[dict]:
        """Return all questions for a session in order."""
        cursor = (
            self.db["questions"]
            .find({"session_id": session_id}, {"_id": 0})
            .sort("order_index", ASCENDING)
        )
        return await cursor.to_list(length=100)

    async def get_question(self, question_id: str) -> dict | None:
        return await self.db["questions"].find_one({"id": question_id}, {"_id": 0})

    # ── Answer CRUD ───────────────────────────────────────────────────────────

    async def save_answer(self, answer_data: dict) -> str:
        """Persist a candidate's answer."""
        await self.db["answers"].insert_one(answer_data)
        return answer_data["id"]

    async def get_answers_for_session(self, session_id: str) -> list[dict]:
        """Return all answers for a session."""
        cursor = self.db["answers"].find({"session_id": session_id}, {"_id": 0})
        return await cursor.to_list(length=100)

    async def get_answer_for_question(self, session_id: str, question_id: str) -> dict | None:
        return await self.db["answers"].find_one(
            {"session_id": session_id, "question_id": question_id}, {"_id": 0}
        )

    # ── Combined Queries ──────────────────────────────────────────────────────

    async def get_qa_pairs(self, session_id: str) -> list[dict]:
        """Return merged question+answer pairs for summary generation."""
        questions = await self.get_questions_for_session(session_id)
        answers = await self.get_answers_for_session(session_id)

        answer_map = {a["question_id"]: a for a in answers}

        pairs = []
        for q in questions:
            answer = answer_map.get(q["id"])
            pairs.append(
                {
                    "question_id": q["id"],
                    "question": q["question_text"],
                    "topic": q.get("topic", ""),
                    "difficulty": q.get("difficulty", ""),
                    "source_books": q.get("source_books", []),
                    "answer": answer["answer_text"] if answer else None,
                    "submitted_at": answer["submitted_at"].isoformat() if answer else None,
                }
            )
        return pairs
