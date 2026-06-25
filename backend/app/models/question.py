"""Pydantic models for interview questions and answers."""

from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class DifficultyLevel(str, Enum):
    CONCEPTUAL = "conceptual"
    APPLIED = "applied"
    SCENARIO = "scenario"


class Question(BaseModel):
    """A single generated interview question with full traceability."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    question_text: str
    topic: str = Field(default="", description="Topic area this question covers")
    difficulty: DifficultyLevel = DifficultyLevel.CONCEPTUAL
    order_index: int = Field(description="Question number in the session (1-based)")
    rag_context_snippets: list[str] = Field(
        default_factory=list,
        description="The retrieved knowledge base chunks used to generate this question",
    )
    source_books: list[str] = Field(
        default_factory=list,
        description="Which textbooks the context came from",
    )
    what_to_look_for: str = Field(
        default="",
        description="LLM hint about what a strong answer should include",
    )
    generated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        use_enum_values = True


class Answer(BaseModel):
    """Candidate's response to a question."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    question_id: str
    answer_text: str
    submitted_at: datetime = Field(default_factory=datetime.utcnow)


class AnswerSubmitRequest(BaseModel):
    answer_text: str = Field(..., min_length=1, max_length=5000)


class QuestionResponse(BaseModel):
    """Returned to the frontend for display."""

    question_id: str
    question_text: str
    topic: str
    difficulty: str
    order_index: int
    total_questions: int
    is_final: bool = False


class AnswerSubmitResponse(BaseModel):
    """Response after submitting an answer."""

    message: str
    next_question: Optional[QuestionResponse] = None
    session_complete: bool = False
    session_id: str
