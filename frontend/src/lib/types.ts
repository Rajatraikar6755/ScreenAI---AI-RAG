/**
 * TypeScript type definitions matching backend Pydantic models.
 */

export type Role =
  | "ai_ml_engineer"
  | "backend_engineer"
  | "data_scientist"
  | "frontend_engineer";

export const ROLE_LABELS: Record<Role, string> = {
  ai_ml_engineer: "AI/ML Engineer",
  backend_engineer: "Backend Engineer",
  data_scientist: "Data Scientist",
  frontend_engineer: "Frontend Engineer",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  ai_ml_engineer:
    "Deep learning, model training, MLOps, and algorithm design",
  backend_engineer:
    "System design, APIs, databases, and scalable architecture",
  data_scientist:
    "Statistical analysis, feature engineering, and data pipelines",
  frontend_engineer:
    "UI/UX, React, performance optimization, and accessibility",
};

export const ROLE_ICONS: Record<Role, string> = {
  ai_ml_engineer: "🤖",
  backend_engineer: "⚙️",
  data_scientist: "📊",
  frontend_engineer: "🎨",
};

// ── Resume ──────────────────────────────────────────────────────────────────

export interface ResumeData {
  raw_text: string;
  candidate_name: string;
  email?: string;
  phone?: string;
  skills: string[];
  technologies: string[];
  domains: string[];
  experience_years?: number;
  education: string[];
  previous_roles: string[];
  projects: string[];
  summary: string;
}

export interface ResumeUploadResponse {
  resume_data: ResumeData;
  file_name: string;
  parse_status: string;
  message: string;
}

// ── Session ──────────────────────────────────────────────────────────────────

export type SessionStatus =
  | "created"
  | "in_progress"
  | "completed"
  | "abandoned";

export interface SessionCreateResponse {
  session_id: string;
  candidate_name: string;
  role: Role;
  status: SessionStatus;
  total_questions: number;
  message: string;
}

// ── Question & Answer ────────────────────────────────────────────────────────

export type DifficultyLevel = "conceptual" | "applied" | "scenario";

export const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  conceptual: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  applied: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  scenario: "text-purple-400 bg-purple-400/10 border-purple-400/30",
};

export interface QuestionResponse {
  question_id: string;
  question_text: string;
  topic: string;
  difficulty: DifficultyLevel;
  order_index: number;
  total_questions: number;
  is_final: boolean;
}

export interface AnswerSubmitResponse {
  message: string;
  next_question?: QuestionResponse;
  session_complete: boolean;
  session_id: string;
}

// ── Summary ──────────────────────────────────────────────────────────────────

export interface TopicAnalysis {
  topic: string;
  coverage: "strong" | "adequate" | "weak";
  notes: string;
}

export interface SessionSummary {
  session_id: string;
  candidate_name: string;
  role: string;
  total_questions: number;
  questions_answered: number;
  duration_minutes?: number;
  overall_assessment: string;
  topic_analysis: TopicAnalysis[];
  key_strengths: string[];
  improvement_areas: string[];
  confidence_score: number;
  recommendation: string;
  qa_pairs: QAPair[];
  completed_at?: string;
}

export interface QAPair {
  question_id: string;
  question: string;
  topic: string;
  difficulty: string;
  source_books: string[];
  answer?: string;
  submitted_at?: string;
}
