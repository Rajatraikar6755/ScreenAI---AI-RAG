"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSessionSummary } from "@/lib/api";
import { SessionSummary, ROLE_LABELS, Role, ROLE_ICONS } from "@/lib/types";
import { useInterviewStore } from "@/store/interview";

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string;

  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { reset } = useInterviewStore();

  useEffect(() => {
    if (!sessionId) return;
    
    let isMounted = true;
    
    const fetchSummary = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getSessionSummary(sessionId);
        if (isMounted) {
          setSummary(data);
        }
      } catch (e: unknown) {
        if (isMounted) {
          const err = e as { response?: { data?: { detail?: string } } };
          setError(
            err.response?.data?.detail || 
            "Failed to load interview results. Please try again."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSummary();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  const handleStartOver = () => {
    reset();
    router.push("/"); // Or /interview if you have a specific setup page
  };

  if (loading) {
    return (
      <div className="min-h-screen animated-bg flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
          <span className="animate-pulse">✨</span>
        </div>
        <div className="text-center">
          <p className="font-semibold text-base mb-1" style={{ color: "var(--text-primary)" }}>
            Analyzing Your Interview…
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Our AI is generating your comprehensive feedback report.
          </p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md glass rounded-2xl p-8 text-center" style={{ border: "1px solid rgba(239,68,68,0.2)" }}>
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="font-bold text-lg mb-2" style={{ color: "var(--text-primary)" }}>
            Results Not Found
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            {error || "Could not load the summary for this session."}
          </p>
          <button onClick={handleStartOver} className="btn-outline px-6 py-2.5 rounded-xl text-sm font-semibold">
            ← Back Home
          </button>
        </div>
      </div>
    );
  }

  // Calculate score color
  const score = summary.confidence_score || 0;
  let scoreColor = "#ef4444"; // Red
  if (score >= 80) scoreColor = "#10b981"; // Green
  else if (score >= 60) scoreColor = "#f59e0b"; // Yellow

  return (
    <div className="min-h-screen animated-bg p-4 sm:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 glass rounded-2xl p-6 sm:p-8" style={{ border: "1px solid var(--border-subtle)" }}>
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                Interview Complete
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
              {summary.candidate_name}&apos;s Results
            </h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {ROLE_ICONS[summary.role as Role] || "💼"} {ROLE_LABELS[summary.role as Role] || summary.role}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div className="inline-block relative">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
                <circle cx="48" cy="48" r="40" stroke={scoreColor} strokeWidth="8" fill="none" 
                  strokeDasharray={`${2 * Math.PI * 40}`} 
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
                  className="transition-all duration-1000 ease-out" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold" style={{ color: scoreColor }}>{score}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Assessment */}
        <div className="glass rounded-2xl p-6 sm:p-8" style={{ border: "1px solid var(--border-subtle)" }}>
          <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>Overall Assessment</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {summary.overall_assessment}
          </p>
          
          <div className="mt-6 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)" }}>
            <span className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>Final Recommendation</span>
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{summary.recommendation}</span>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6" style={{ border: "1px solid rgba(16,185,129,0.15)", background: "rgba(16,185,129,0.03)" }}>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "#10b981" }}>
              <span className="w-6 h-6 rounded flex items-center justify-center bg-green-500/20">💪</span>
              Key Strengths
            </h3>
            <ul className="space-y-2.5">
              {summary.key_strengths?.map((strength, i) => (
                <li key={i} className="flex gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
                  <span style={{ color: "#10b981" }}>✓</span> {strength}
                </li>
              ))}
              {(!summary.key_strengths || summary.key_strengths.length === 0) && (
                <li className="text-sm text-gray-500 italic">No key strengths highlighted.</li>
              )}
            </ul>
          </div>

          <div className="glass rounded-2xl p-6" style={{ border: "1px solid rgba(245,158,11,0.15)", background: "rgba(245,158,11,0.03)" }}>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "#f59e0b" }}>
              <span className="w-6 h-6 rounded flex items-center justify-center bg-amber-500/20">🎯</span>
              Areas for Improvement
            </h3>
            <ul className="space-y-2.5">
              {summary.improvement_areas?.map((area, i) => (
                <li key={i} className="flex gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
                  <span style={{ color: "#f59e0b" }}>→</span> {area}
                </li>
              ))}
              {(!summary.improvement_areas || summary.improvement_areas.length === 0) && (
                <li className="text-sm text-gray-500 italic">No specific improvement areas highlighted.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Topic Analysis */}
        {summary.topic_analysis && summary.topic_analysis.length > 0 && (
          <div className="glass rounded-2xl p-6 sm:p-8" style={{ border: "1px solid var(--border-subtle)" }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>Topic Breakdown</h2>
            <div className="space-y-4">
              {summary.topic_analysis.map((topic, i) => {
                let covColor = "#ef4444";
                if (topic.coverage === "strong") covColor = "#10b981";
                else if (topic.coverage === "adequate") covColor = "#f59e0b";
                
                return (
                  <div key={i} className="p-4 rounded-xl flex flex-col sm:flex-row sm:items-start gap-4" style={{ background: "rgba(0,0,0,0.2)" }}>
                    <div className="w-full sm:w-1/3">
                      <div className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{topic.topic}</div>
                      <span className="text-xs px-2 py-0.5 rounded uppercase tracking-wider font-bold" style={{ background: `${covColor}15`, color: covColor }}>
                        {topic.coverage}
                      </span>
                    </div>
                    <div className="w-full sm:w-2/3 text-sm" style={{ color: "var(--text-secondary)" }}>
                      {topic.notes}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* QA Breakdown */}
        {summary.qa_pairs && summary.qa_pairs.length > 0 && (
          <div className="glass rounded-2xl p-6 sm:p-8" style={{ border: "1px solid var(--border-subtle)" }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>Q&A Review</h2>
            <div className="space-y-6">
              {summary.qa_pairs.map((qa, i) => (
                <div key={i} className="border-b border-gray-800 last:border-0 pb-6 last:pb-0">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-800 text-gray-300">
                      Q{i + 1}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-900/30 text-blue-400">
                      {qa.difficulty}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-900/30 text-purple-400">
                      {qa.topic}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{qa.question}</h4>
                  <div className="bg-black/30 p-4 rounded-xl relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-xl opacity-50"></div>
                    <p className="text-sm italic" style={{ color: "var(--text-secondary)" }}>
                      {qa.answer || <span className="text-gray-500">No answer provided.</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center mt-8">
          <button onClick={handleStartOver} className="btn-primary px-8 py-3 rounded-xl font-bold text-white text-sm">
            Start New Interview
          </button>
        </div>

      </div>
    </div>
  );
}
