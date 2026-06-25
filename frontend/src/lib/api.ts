/**
 * Axios-based API client for communicating with the FastAPI backend.
 * All API calls go through this module — no raw fetch() in components.
 */

import axios from "axios";
import type {
  ResumeUploadResponse,
  SessionCreateResponse,
  QuestionResponse,
  AnswerSubmitResponse,
  SessionSummary,
  Role,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // LLM calls can take time
  headers: { "Content-Type": "application/json" },
});

// ── Resume ────────────────────────────────────────────────────────────────────

export async function uploadResume(file: File): Promise<ResumeUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post<ResumeUploadResponse>("/api/resume/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// ── Session ───────────────────────────────────────────────────────────────────

export async function createSession(params: {
  candidate_name: string;
  role: Role;
  resume_text: string;
  extracted_skills: string[];
  extracted_domains: string[];
  experience_years?: number | null;
}): Promise<SessionCreateResponse> {
  const res = await api.post<SessionCreateResponse>("/api/sessions/create", params);
  return res.data;
}

export async function getSession(sessionId: string): Promise<Record<string, unknown>> {
  const res = await api.get(`/api/sessions/${sessionId}`);
  return res.data;
}

// ── Interview Lifecycle ───────────────────────────────────────────────────────

export async function startInterview(sessionId: string): Promise<QuestionResponse> {
  const res = await api.post<QuestionResponse>(`/api/interview/${sessionId}/start`);
  return res.data;
}

export async function submitAnswer(
  sessionId: string,
  questionId: string,
  answerText: string
): Promise<AnswerSubmitResponse> {
  const res = await api.post<AnswerSubmitResponse>(
    `/api/interview/${sessionId}/answer/${questionId}`,
    { answer_text: answerText }
  );
  return res.data;
}

export async function getProgress(
  sessionId: string
): Promise<{ status: string; current_question_index: number; total_questions: number }> {
  const res = await api.get(`/api/interview/${sessionId}/progress`);
  return res.data;
}

// ── Summary ───────────────────────────────────────────────────────────────────

export async function getSessionSummary(sessionId: string): Promise<SessionSummary> {
  const res = await api.get<SessionSummary>(`/api/sessions/${sessionId}/summary`);
  return res.data;
}

// ── Health ────────────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<{ status: string }> {
  const res = await api.get("/api/health");
  return res.data;
}

export default api;
