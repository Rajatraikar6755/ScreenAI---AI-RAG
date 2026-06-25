"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSessionSummary } from "@/lib/api";
import { SessionSummary, ROLE_LABELS, ROLE_ICONS } from "@/lib/types";

const RECOMMENDATION_STYLES: Record<string, string> = {
  "Outstanding": "text-violet-400 bg-violet-400/10 border-violet-400/30",
  "Great": "text-indigo-400 bg-indigo-400/10 border-indigo-400/30",
  "Strong Hire": "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  "Potential Hire": "text-blue-400 bg-blue-400/10 border-blue-400/30",
  "Needs Development": "text-amber-400 bg-amber-400/10 border-amber-400/30",
  "Not Recommended": "text-red-400 bg-red-400/10 border-red-400/30",
};

const COVERAGE_STYLES: Record<string, string> = {
  strong: "text-emerald-400",
  adequate: "text-blue-400",
  weak: "text-amber-400",
};

export default function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await getSessionSummary(sessionId);
        setSummary(data);
      } catch (e: unknown) {
        const err = e as { response?: { data?: { detail?: string } } };
        setError(err.response?.data?.detail || "Failed to load results.");
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300 font-medium">Analysing your interview...</p>
          <p className="text-slate-500 text-sm mt-1">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center p-6">
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-red-400 mb-4">{error || "Results not available."}</p>
          <button
            onClick={() => router.push("/")}
            className="btn-primary px-6 py-3 rounded-xl text-white font-semibold"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const roleKey = summary.role as keyof typeof ROLE_LABELS;
  const recStyle = RECOMMENDATION_STYLES[summary.recommendation] || RECOMMENDATION_STYLES["Needs Development"];

  return (
    <div className="min-h-screen bg-slate-950 dot-grid py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="glass rounded-2xl p-8 border border-white/5">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-slate-400 text-sm mb-1">Interview Complete</p>
              <h1 className="text-3xl font-bold gradient-text">
                {summary.candidate_name}
              </h1>
              <p className="text-slate-400 mt-1">
                {ROLE_ICONS[roleKey] || "💼"} {ROLE_LABELS[roleKey] || summary.role}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-3 justify-end mb-3">
                <div className={`inline-flex items-center px-4 py-2 rounded-xl border font-bold text-lg ${recStyle}`}>
                  {summary.recommendation}
                </div>
                {summary.confidence_score !== undefined && (
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-indigo-500/50 bg-indigo-500/10">
                    <span className="text-indigo-300 font-bold text-sm">{summary.confidence_score}%</span>
                  </div>
                )}
              </div>
              <div className="flex gap-4 justify-end text-sm text-slate-400">
                <span>📋 {summary.questions_answered}/{summary.total_questions} Questions</span>
                {summary.duration_minutes && (
                  <span>⏱ {summary.duration_minutes} min</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Overall Assessment ───────────────────────────────────────── */}
        <div className="glass rounded-2xl p-6 border border-white/5">
          <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <span>📝</span> Overall Assessment
          </h2>
          <p className="text-slate-300 leading-relaxed text-sm">
            {summary.overall_assessment}
          </p>
        </div>

        {/* ── Strengths & Improvements ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-6 border border-emerald-500/10">
            <h2 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-2">
              <span>💪</span> Key Strengths
            </h2>
            <ul className="space-y-2">
              {summary.key_strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                  {s}
                </li>
              ))}
              {summary.key_strengths.length === 0 && (
                <li className="text-slate-500 text-sm">—</li>
              )}
            </ul>
          </div>
          <div className="glass rounded-2xl p-6 border border-amber-500/10">
            <h2 className="text-lg font-semibold text-amber-400 mb-4 flex items-center gap-2">
              <span>🎯</span> Areas for Improvement
            </h2>
            <ul className="space-y-2">
              {summary.improvement_areas.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-amber-400 mt-0.5 flex-shrink-0">→</span>
                  {a}
                </li>
              ))}
              {summary.improvement_areas.length === 0 && (
                <li className="text-slate-500 text-sm">—</li>
              )}
            </ul>
          </div>
        </div>

        {/* ── Topic Analysis ───────────────────────────────────────────── */}
        {summary.topic_analysis.length > 0 && (
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <span>📊</span> Topic-by-Topic Analysis
            </h2>
            <div className="space-y-3">
              {summary.topic_analysis.map((t, i) => (
                <div key={i} className="flex items-start gap-4 p-3 rounded-xl bg-slate-800/30">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-slate-200 text-sm font-medium">{t.topic}</span>
                      <span
                        className={`text-xs font-medium capitalize ${
                          COVERAGE_STYLES[t.coverage] || "text-slate-400"
                        }`}
                      >
                        {t.coverage}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs">{t.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Q&A Transcript ───────────────────────────────────────────── */}
        <div className="glass rounded-2xl p-6 border border-white/5">
          <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <span>💬</span> Interview Transcript
          </h2>
          <div className="space-y-5">
            {summary.qa_pairs.map((pair, i) => (
              <div key={i} className="border-l-2 border-indigo-500/40 pl-4 space-y-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-indigo-400">Q{i + 1}</span>
                    {pair.topic && (
                      <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                        {pair.topic}
                      </span>
                    )}
                    {pair.source_books?.length > 0 && (
                      <span className="text-xs text-slate-600">
                        📚 {pair.source_books[0]}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-200 text-sm leading-relaxed">{pair.question}</p>
                </div>
                <div className="pl-3 border-l border-slate-700">
                  <span className="text-xs font-bold text-violet-400 block mb-1">Answer</span>
                  <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                    {pair.answer || <em className="text-slate-600">No answer provided</em>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 justify-center pb-8">
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors font-medium"
          >
            🏠 Return Home
          </button>
          <button
            onClick={() => router.push("/interview")}
            className="btn-primary px-6 py-3 rounded-xl text-white font-semibold"
          >
            🔄 Start New Interview
          </button>
        </div>
      </div>
    </div>
  );
}
