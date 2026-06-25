"""Pydantic models for interview sessions."""

from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class Role(str, Enum):
    AI_ML_ENGINEER = "ai_ml_engineer"
    BACKEND_ENGINEER = "backend_engineer"
    DATA_SCIENTIST = "data_scientist"
    FRONTEND_ENGINEER = "frontend_engineer"


class SessionStatus(str, Enum):
    CREATED = "created"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class Session(BaseModel):
    """Represents a complete interview session."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    candidate_name: str
    role: Role
    resume_data: dict = Field(default_factory=dict, description="Serialized ResumeData")
    status: SessionStatus = SessionStatus.CREATED
    current_question_index: int = 0
    total_questions: int = 7
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        use_enum_values = True


class SessionCreateRequest(BaseModel):
    candidate_name: str = Field(..., min_length=1, max_length=100)
    role: Role
    resume_text: str = Field(..., min_length=50, description="Parsed resume text")
    extracted_skills: list[str] = Field(default_factory=list)
    extracted_domains: list[str] = Field(default_factory=list)
    experience_years: Optional[float] = None


class SessionCreateResponse(BaseModel):
    session_id: str
    candidate_name: str
    role: str
    status: str
    total_questions: int
    message: str = "Session created. Call /start to begin the interview."


class SessionSummary(BaseModel):
    """Final output summary of the interview."""

    session_id: str
    candidate_name: str
    role: str
    total_questions: int
    questions_answered: int
    duration_minutes: Optional[float] = None
    overall_assessment: str = ""
    topic_analysis: list[dict] = Field(default_factory=list)
    key_strengths: list[str] = Field(default_factory=list)
    improvement_areas: list[str] = Field(default_factory=list)
    confidence_score: int = 0
    recommendation: str = ""
    qa_pairs: list[dict] = Field(default_factory=list)
    completed_at: Optional[str] = None
