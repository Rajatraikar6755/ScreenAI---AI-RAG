"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { startInterview, submitAnswer } from "@/lib/api";
import { useInterviewStore } from "@/store/interview";
import {
  QuestionResponse,
  DIFFICULTY_COLORS,
  DifficultyLevel,
  ROLE_LABELS,
  ROLE_ICONS,
} from "@/lib/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function InterviewSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string;

  const { sessionResponse, selectedRole, resumeData, setCurrentQuestion, reset } =
    useInterviewStore();

  // ── State ──────────────────────────────────────────────────────────────────
  const [question, setQuestion] = useState<QuestionResponse | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [showTip, setShowTip] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalQuestions = sessionResponse?.total_questions ?? 7;
  const candidateName =
    sessionResponse?.candidate_name ?? resumeData?.candidate_name ?? "Candidate";

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!started) return;
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started]);

  // ── Start Interview ────────────────────────────────────────────────────────
  const fetchFirstQuestion = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError("");
    try {
      const q = await startInterview(sessionId);
      setQuestion(q);
      setCurrentQuestion(q);
      setStarted(true);
      setTimeout(() => setFadeIn(true), 50);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(
        err.response?.data?.detail ||
          "Failed to start interview. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [sessionId, setCurrentQuestion]);

  useEffect(() => {
    fetchFirstQuestion();
    // Show a tip after 3 seconds
    const tipTimer = setTimeout(() => setShowTip(true), 3000);
    return () => clearTimeout(tipTimer);
  }, [fetchFirstQuestion]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 320) + "px";
    }
  }, [answer]);

  // ── Submit Answer ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!question || !answer.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await submitAnswer(sessionId, question.question_id, answer.trim());

      if (res.session_complete) {
        // Done — go to results
        reset();
        router.push(`/results/${sessionId}`);
        return;
      }

      if (res.next_question) {
        setFadeIn(false);
        setTimeout(() => {
          setQuestion(res.next_question!);
          setCurrentQuestion(res.next_question!);
          setAnswer("");
          setFadeIn(true);
        }, 300);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(
        err.response?.data?.detail || "Failed to submit answer. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ── Progress ───────────────────────────────────────────────────────────────
  const currentIndex = question?.order_index ?? 0;
  const progressPct = totalQuestions > 0 ? (currentIndex / totalQuestions) * 100 : 0;
  const difficulty = (question?.difficulty ?? "conceptual") as DifficultyLevel;
  const difficultyClass = DIFFICULTY_COLORS[difficulty] ?? DIFFICULTY_COLORS.conceptual;

  // ── Loading Screen ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen animated-bg flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
            style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)" }}
          >
            AI
          </div>
          <div
            className="absolute -inset-1 rounded-2xl opacity-30 animate-ping"
            style={{ background: "rgba(59,130,246,0.4)" }}
          />
        </div>
        <div className="text-center">
          <p className="font-semibold text-base mb-1" style={{ color: "var(--text-primary)" }}>
            Preparing your interview…
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Generating tailored questions from ML/AI textbooks
          </p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full animate-bounce"
              style={{
                background: "#3b82f6",
                animationDelay: `${i * 0.15}s`,
                opacity: 0.7,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Error Screen ───────────────────────────────────────────────────────────
  if (error && !question) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center p-6">
        <div
          className="w-full max-w-md glass rounded-2xl p-8 text-center"
          style={{ border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="font-bold text-lg mb-2" style={{ color: "var(--text-primary)" }}>
            Something went wrong
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            {error}
          </p>
          <button
            onClick={() => router.push("/interview")}
            className="btn-outline px-6 py-2.5 rounded-xl text-sm font-semibold"
          >
            ← Back to Setup
          </button>
        </div>
      </div>
    );
  }

  // ── Main UI ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen animated-bg flex flex-col">
      {/* ── Top Bar ── */}
      <header
        className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between"
        style={{
          background: "rgba(7,9,15,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
            style={{ background: "#1d4ed8" }}
          >
            AI
          </div>
          <span className="font-bold text-sm hidden sm:block" style={{ color: "var(--text-primary)" }}>
            Screen<span className="gradient-text">AI</span>
          </span>
        </div>

        {/* Candidate + Role */}
        <div className="flex items-center gap-3">
          {selectedRole && (
            <span
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              {ROLE_ICONS[selectedRole]} {ROLE_LABELS[selectedRole]}
            </span>
          )}
          <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            {candidateName}
          </span>
        </div>

        {/* Timer */}
        <div
          className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--border-subtle)",
            color: elapsed > 1800 ? "#ef4444" : "var(--text-secondary)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          {formatTime(elapsed)}
        </div>
      </header>

      {/* ── Progress Bar ── */}
      <div className="w-full h-0.5" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{
            width: `${progressPct}%`,
            background: "linear-gradient(90deg, #1d4ed8, #3b82f6, #60a5fa)",
          }}
        />
      </div>

      {/* ── Content ── */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl space-y-4">

          {/* Question Counter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="label-mono"
                style={{ fontSize: "0.7rem" }}
              >
                Question {currentIndex} of {totalQuestions}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${difficultyClass}`}
              >
                {difficulty}
              </span>
            </div>
            {question?.topic && (
              <span
                className="text-xs px-2 py-0.5 rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-muted)",
                }}
              >
                {question.topic}
              </span>
            )}
          </div>

          {/* Question Dots */}
          <div className="flex gap-1.5">
            {Array.from({ length: totalQuestions }).map((_, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-all duration-500"
                style={{
                  background:
                    i < currentIndex - 1
                      ? "#10b981"
                      : i === currentIndex - 1
                      ? "#3b82f6"
                      : "rgba(255,255,255,0.08)",
                }}
              />
            ))}
          </div>

          {/* Question Card */}
          <div
            className="glass rounded-2xl overflow-hidden transition-all duration-300"
            style={{
              border: "1px solid var(--border-subtle)",
              opacity: fadeIn ? 1 : 0,
              transform: fadeIn ? "translateY(0)" : "translateY(8px)",
            }}
          >
            <div
              className="h-px w-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #2563eb, #3b82f6, transparent)",
              }}
            />
            <div className="p-6">
              <p
                className="text-base sm:text-lg font-semibold leading-relaxed"
                style={{ color: "var(--text-primary)", lineHeight: 1.6 }}
              >
                {question?.question_text}
              </p>
            </div>
          </div>

          {/* Answer Box */}
          <div
            className="glass rounded-2xl overflow-hidden transition-all duration-300"
            style={{
              border: "1px solid var(--border-subtle)",
              opacity: fadeIn ? 1 : 0,
              transform: fadeIn ? "translateY(0)" : "translateY(12px)",
            }}
          >
            <div className="px-5 pt-4 pb-1 flex items-center justify-between">
              <span
                className="text-xs font-semibold"
                style={{ color: "var(--text-muted)" }}
              >
                Your Answer
              </span>
              <span
                className="text-xs"
                style={{ color: answer.length > 50 ? "var(--text-muted)" : "#64748b" }}
              >
                {answer.length} chars
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer here… Be thorough and explain your reasoning."
              disabled={submitting}
              rows={5}
              className="w-full resize-none bg-transparent px-5 pb-4 text-sm outline-none"
              style={{
                color: "var(--text-primary)",
                caretColor: "#3b82f6",
                minHeight: "120px",
                maxHeight: "320px",
              }}
            />

            {/* Tip */}
            {showTip && answer.length === 0 && (
              <div
                className="mx-5 mb-4 px-3 py-2 rounded-lg text-xs"
                style={{
                  background: "rgba(37,99,235,0.06)",
                  border: "1px solid rgba(37,99,235,0.15)",
                  color: "var(--text-secondary)",
                }}
              >
                💡 <strong style={{ color: "var(--text-primary)" }}>Tip:</strong> Press{" "}
                <kbd
                  className="px-1 py-0.5 rounded text-xs"
                  style={{ background: "rgba(255,255,255,0.08)", fontFamily: "monospace" }}
                >
                  Ctrl + Enter
                </kbd>{" "}
                to submit your answer quickly.
              </div>
            )}

            {/* Submit row */}
            <div
              className="px-5 pb-5 flex items-center justify-between gap-4"
              style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}
            >
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                {question?.is_final ? (
                  <span className="text-amber-400 font-semibold">
                    🏁 This is the final question
                  </span>
                ) : (
                  `${totalQuestions - currentIndex} question${
                    totalQuestions - currentIndex !== 1 ? "s" : ""
                  } remaining`
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !answer.trim()}
                className="btn-primary px-6 py-2.5 rounded-xl font-semibold text-white text-sm flex items-center gap-2"
                style={{
                  opacity: submitting || !answer.trim() ? 0.35 : 1,
                  minWidth: "140px",
                  justifyContent: "center",
                }}
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting…
                  </>
                ) : question?.is_final ? (
                  "Finish Interview 🏁"
                ) : (
                  "Next Question →"
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="px-4 py-3 rounded-xl text-xs"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#fca5a5",
              }}
            >
              {error}
            </div>
          )}

          {/* Footer note */}
          <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
            Questions are sourced from ML/AI textbooks · Answers are evaluated contextually
          </p>
        </div>
      </main>
    </div>
  );
}
