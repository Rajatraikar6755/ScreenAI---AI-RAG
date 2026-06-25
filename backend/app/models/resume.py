"""Pydantic models for resume data."""

from pydantic import BaseModel, Field
from typing import Optional


class ResumeData(BaseModel):
    """Structured data extracted from a candidate's resume."""

    raw_text: str = Field(..., description="Full text extracted from resume PDF")
    candidate_name: str = Field(default="Candidate", description="Extracted candidate name")
    email: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None)
    skills: list[str] = Field(default_factory=list, description="Extracted technical skills")
    technologies: list[str] = Field(default_factory=list, description="Frameworks, tools, libraries")
    domains: list[str] = Field(default_factory=list, description="Domain knowledge areas (NLP, CV, etc.)")
    experience_years: Optional[float] = Field(default=None, description="Estimated years of experience")
    education: list[str] = Field(default_factory=list, description="Education qualifications")
    previous_roles: list[str] = Field(default_factory=list, description="Prior job titles")
    projects: list[str] = Field(default_factory=list, description="Notable project summaries")
    summary: str = Field(default="", description="LLM-generated one-paragraph candidate summary")


class ResumeUploadResponse(BaseModel):
    """Response returned after resume is parsed."""

    resume_data: ResumeData
    file_name: str
    parse_status: str = "success"
    message: str = "Resume parsed successfully"
