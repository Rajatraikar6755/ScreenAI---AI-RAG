"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { startInterview, submitAnswer } from "@/lib/api";
import { useInterviewStore } from "@/store/interview";
import { QuestionResponse, DIFFICULTY_COLORS } from "@/lib/types";

type QARecord = {
  question: QuestionResponse;
  answer: string;
};

export default function LiveInterviewPage() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { sessionResponse, resumeData } = useInterviewStore();

  const [currentQuestion, setCurrentQuestion] = useState<QuestionResponse | null>(null);
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState<QARecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [timeElapsed, setTimeElapsed] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setTimeElapsed((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Start interview on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initInterview = async () => {
      try {
        const q = await startInterview(sessionId);
        setCurrentQuestion(q);
      } catch (e: unknown) {
        const err = e as { response?: { data?: { detail?: string } } };
        setError(err.response?.data?.detail || "Failed to start interview.");
      } finally {
        setLoading(false);
      }
    };
    initInterview();
  }, [sessionId]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, currentQuestion]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [answer]);

  const handleSubmit = async () => {
    if (!currentQuestion || !answer.trim()) return;
    setSubmitting(true);
    setError("");

    const submittedAnswer = answer.trim();
    const submittedQuestion = currentQuestion;

    setHistory((prev) => [
      ...prev,
      { question: submittedQuestion, answer: submittedAnswer },
    ]);
    setAnswer("");
    setCurrentQuestion(null);

    try {
      const res = await submitAnswer(sessionId, submittedQuestion.question_id, submittedAnswer);

      if (res.session_complete) {
        router.push(`/results/${sessionId}`);
        return;
      }

      if (res.next_question) {
        setCurrentQuestion(res.next_question);
        // Focus textarea after question loads
        setTimeout(() => textareaRef.current?.focus(), 100);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err.response?.data?.detail || "Failed to submit answer.");
      // Restore on error
      setCurrentQuestion(submittedQuestion);
      setAnswer(submittedAnswer);
      setHistory((prev) => prev.slice(0, -1));
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const total = currentQuestion?.total_questions || sessionResponse?.total_questions || 7;
  const current = currentQuestion?.order_index || history.length + 1;
  const progress = (history.length / total) * 100;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
            <span className="text-sm font-medium text-slate-300">
              Interview in Progress
            </span>
          </div>

          <div className="flex items-center gap-6">
            {/* Progress bar */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                Q{Math.min(current, total)} / {total}
              </span>
              <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            {/* Timer */}
            <span className="text-xs font-mono text-slate-400 tabular-nums">
              ⏱ {formatTime(timeElapsed)}
            </span>
          </div>
        </div>
      </header>

      {/* ── Chat Window ─────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-6 pb-64">
        {/* Greeting */}
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm flex-shrink-0">
            🤖
          </div>
          <div className="glass rounded-2xl rounded-tl-none px-5 py-4 max-w-2xl">
            <p className="text-slate-300 text-sm leading-relaxed">
              Hello <strong className="text-indigo-400">{resumeData?.candidate_name || "there"}</strong>!{" "}
              I&apos;m your AI interviewer today. I&apos;ve analyzed your resume and prepared questions{" "}
              tailored specifically for you. Let&apos;s begin — take your time with each answer.
            </p>
          </div>
        </div>

        {/* History */}
        {history.map((record, idx) => (
          <div key={idx} className="space-y-3">
            {/* AI Question */}
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm flex-shrink-0">
                🤖
              </div>
              <div className="glass rounded-2xl rounded-tl-none px-5 py-4 max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                      DIFFICULTY_COLORS[record.question.difficulty]
                    }`}
                  >
                    {record.question.difficulty}
                  </span>
                  {record.question.topic && (
                    <span className="text-xs text-slate-500">{record.question.topic}</span>
                  )}
                </div>
                <p className="text-slate-200 text-sm leading-relaxed">
                  {record.question.question_text}
                </p>
              </div>
            </div>

            {/* Candidate Answer */}
            <div className="flex gap-3 justify-end">
              <div className="bg-indigo-600/30 border border-indigo-500/30 rounded-2xl rounded-tr-none px-5 py-4 max-w-2xl">
                <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {record.answer}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-sm flex-shrink-0">
                👤
              </div>
            </div>
          </div>
        ))}

        {/* Loading next question */}
        {submitting && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm flex-shrink-0">
              🤖
            </div>
            <div className="glass rounded-2xl rounded-tl-none px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-400">Generating next question...</span>
              </div>
            </div>
          </div>
        )}

        {/* Current question */}
        {currentQuestion && !submitting && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm flex-shrink-0">
              🤖
            </div>
            <div className="glass rounded-2xl rounded-tl-none px-5 py-4 max-w-2xl border border-indigo-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                    DIFFICULTY_COLORS[currentQuestion.difficulty]
                  }`}
                >
                  {currentQuestion.difficulty}
                </span>
                {currentQuestion.topic && (
                  <span className="text-xs text-slate-500">{currentQuestion.topic}</span>
                )}
              </div>
              <p className="text-slate-100 text-sm leading-relaxed font-medium">
                {currentQuestion.question_text}
              </p>
            </div>
          </div>
        )}

        {loading && !currentQuestion && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shimmer flex-shrink-0" />
            <div className="glass rounded-2xl px-5 py-4 w-64 h-16 shimmer" />
          </div>
        )}

        {error && (
          <div className="text-red-400 text-sm p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            ⚠️ {error}
          </div>
        )}

        <div ref={chatBottomRef} />
      </main>

      {/* ── Answer Input (fixed bottom) ─────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 glass border-t border-white/5 p-4">
        <div className="max-w-4xl mx-auto flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
            }}
            placeholder={
              currentQuestion
                ? "Type your answer here... (Ctrl+Enter to submit)"
                : "Waiting for question..."
            }
            disabled={!currentQuestion || submitting}
            rows={1}
            className="flex-1 input-glass rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm resize-none max-h-40 disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={!currentQuestion || !answer.trim() || submitting}
            className="btn-primary px-5 py-3 rounded-xl text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 flex-shrink-0"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Submit ↑</>
            )}
          </button>
        </div>
        <p className="text-xs text-slate-600 text-center mt-2">Ctrl+Enter to submit</p>
      </div>
    </div>
  );
}
