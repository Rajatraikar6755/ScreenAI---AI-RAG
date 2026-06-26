"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { uploadResume, createSession } from "@/lib/api";
import { useInterviewStore } from "@/store/interview";
import { ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_ICONS, Role, ResumeData } from "@/lib/types";

const ROLES: Role[] = ["ai_ml_engineer", "backend_engineer", "data_scientist", "frontend_engineer"];

const ROLE_STYLE: Record<Role, { accent: string; glowBg: string }> = {
  ai_ml_engineer:    { accent: "#3b82f6", glowBg: "rgba(59,130,246,0.08)"  },
  backend_engineer:  { accent: "#0ea5e9", glowBg: "rgba(14,165,233,0.08)"  },
  data_scientist:    { accent: "#10b981", glowBg: "rgba(16,185,129,0.08)"  },
  frontend_engineer: { accent: "#f59e0b", glowBg: "rgba(245,158,11,0.08)"  },
};

type Step = "upload" | "role" | "confirm";
const STEP_LABELS: Record<Step, string> = { upload: "Resume", role: "Select Role", confirm: "Confirm" };
const STEPS: Step[] = ["upload", "role", "confirm"];

export default function InterviewSetupPage() {
  const router = useRouter();
  const { setResumeData, setSelectedRole, setSessionResponse } = useInterviewStore();

  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [selectedRole, setLocalRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedData, setUploadedData] = useState<ResumeData | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) { setFile(accepted[0]); setError(""); }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "text/plain": [".txt"] },
    maxFiles: 1, maxSize: 10 * 1024 * 1024,
  });

  const handleUpload = async () => {
    if (!file) return setError("Please select a resume file.");
    if (!candidateName.trim()) return setError("Please enter your name.");
    setLoading(true); setError("");
    try {
      const res = await uploadResume(file);
      res.resume_data.candidate_name = candidateName.trim();
      setUploadedData(res.resume_data);
      setResumeData(res.resume_data);
      setStep("role");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err.response?.data?.detail || "Failed to parse resume. Please try again.");
    } finally { setLoading(false); }
  };

  const handleStartInterview = async () => {
    if (!selectedRole || !uploadedData) return;
    setLoading(true); setError("");
    try {
      const session = await createSession({
        candidate_name: candidateName.trim() || uploadedData.candidate_name,
        role: selectedRole,
        resume_text: uploadedData.raw_text,
        extracted_skills: uploadedData.skills,
        extracted_domains: uploadedData.domains,
        experience_years: uploadedData.experience_years,
      });
      setSelectedRole(selectedRole);
      setSessionResponse(session);
      router.push(`/interview/${session.session_id}`);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err.response?.data?.detail || "Failed to create session.");
    } finally { setLoading(false); }
  };

  const currentStepIndex = STEPS.indexOf(step);

  return (
    <div className="min-h-screen animated-bg flex flex-col items-center justify-center p-6">
      {/* Brand */}
      <div className="mb-8 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: "#1d4ed8" }}>
          AI
        </div>
        <span className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
          Screen<span className="gradient-text">AI</span>
        </span>
      </div>

      {/* Progress */}
      <div className="w-full max-w-md mb-7">
        <div className="flex items-center">
          {STEPS.map((s, i) => {
            const isDone = currentStepIndex > i;
            const isActive = step === s;
            return (
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                    style={{
                      background: isDone ? "#10b981" : isActive ? "#1d4ed8" : "rgba(255,255,255,0.04)",
                      border: isDone || isActive ? "none" : "1px solid rgba(255,255,255,0.08)",
                      color: isDone || isActive ? "white" : "var(--text-muted)",
                    }}
                  >
                    {isDone
                      ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      : i + 1}
                  </div>
                  <span className="text-xs font-medium mt-1.5 whitespace-nowrap" style={{ color: isActive ? "#60a5fa" : isDone ? "#10b981" : "var(--text-muted)" }}>
                    {STEP_LABELS[s]}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px mx-2 mb-5 transition-all duration-500" style={{ background: isDone ? "#10b981" : "rgba(255,255,255,0.06)" }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md glass rounded-2xl shadow-2xl overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
        <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, #2563eb, #3b82f6, transparent)" }} />
        <div className="p-7">

          {/* Step 1 — Upload */}
          {step === "upload" && (
            <div>
              <div className="label-mono mb-3">Step 1 of 3</div>
              <h1 className="font-bold mb-1.5 gradient-text" style={{ fontSize: "1.6rem", letterSpacing: "-0.025em" }}>
                Upload Your Resume
              </h1>
              <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                We&apos;ll analyze your background to tailor questions specifically for you.
              </p>

              <div className="mb-4">
                <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Full Name</label>
                <input
                  type="text" value={candidateName} onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="w-full input-glass rounded-xl px-4 py-3 text-sm"
                />
              </div>

              <div
                {...getRootProps()}
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200"
                style={{
                  borderColor: isDragActive ? "#3b82f6" : file ? "#10b981" : "rgba(255,255,255,0.08)",
                  background: isDragActive ? "rgba(37,99,235,0.05)" : file ? "rgba(16,185,129,0.04)" : "rgba(7,9,15,0.4)",
                }}
              >
                <input {...getInputProps()} />
                <div className="text-3xl mb-2.5">{file ? "✅" : isDragActive ? "📂" : "📄"}</div>
                {file ? (
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "#10b981" }}>{file.name}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{isDragActive ? "Drop it here!" : "Drag & drop your resume"}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>PDF or TXT · Max 10MB</p>
                  </div>
                )}
              </div>

              {error && <div className="mt-3 text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>{error}</div>}

              <button onClick={handleUpload} disabled={loading || !file || !candidateName.trim()}
                className="btn-primary w-full mt-5 py-3 rounded-xl font-semibold text-white text-sm"
                style={{ opacity: loading || !file || !candidateName.trim() ? 0.35 : 1 }}>
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing...</span>
                  : "Continue →"}
              </button>
            </div>
          )}

          {/* Step 2 — Role */}
          {step === "role" && (
            <div>
              <div className="label-mono mb-3">Step 2 of 3</div>
              <h1 className="font-bold mb-1.5 gradient-text" style={{ fontSize: "1.6rem", letterSpacing: "-0.025em" }}>Choose Your Role</h1>
              <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>Questions will be tailored to that domain.</p>

              {uploadedData && (uploadedData.skills?.length ?? 0) > 0 && (
                <div className="mb-4 p-3 rounded-xl" style={{ background: "rgba(37,99,235,0.05)", border: "1px solid rgba(37,99,235,0.12)" }}>
                  <p className="label-mono mb-2">Detected skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {uploadedData.skills.slice(0, 10).map((s: string) => <span key={s} className="tag-skill">{s}</span>)}
                    {uploadedData.skills.length > 10 && <span className="tag-skill">+{uploadedData.skills.length - 10}</span>}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {ROLES.map((role) => {
                  const st = ROLE_STYLE[role];
                  const isSelected = selectedRole === role;
                  return (
                    <button key={role} onClick={() => setLocalRole(role)}
                      className="w-full p-3.5 rounded-xl border text-left transition-all duration-150"
                      style={{
                        background: isSelected ? st.glowBg : "rgba(7,9,15,0.5)",
                        border: isSelected ? `1px solid ${st.accent}40` : "1px solid var(--border-subtle)",
                      }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                          style={{ background: isSelected ? `${st.accent}18` : "rgba(255,255,255,0.03)", border: `1px solid ${isSelected ? st.accent + "30" : "rgba(255,255,255,0.06)"}` }}>
                          {ROLE_ICONS[role]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs" style={{ color: "var(--text-primary)" }}>{ROLE_LABELS[role]}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{ROLE_DESCRIPTIONS[role]}</p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: st.accent }}>
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {error && <div className="mt-3 text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>{error}</div>}

              <div className="flex gap-2.5 mt-5">
                <button onClick={() => setStep("upload")} className="btn-outline flex-1 py-3 rounded-xl text-sm font-semibold">← Back</button>
                <button onClick={() => { if (!selectedRole) return setError("Please select a role."); setError(""); setStep("confirm"); }}
                  disabled={!selectedRole} className="btn-primary flex-[2] py-3 rounded-xl font-semibold text-white text-sm" style={{ opacity: !selectedRole ? 0.35 : 1 }}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Confirm */}
          {step === "confirm" && selectedRole && (
            <div>
              <div className="label-mono mb-3">Step 3 of 3</div>
              <h1 className="font-bold mb-1.5 gradient-text" style={{ fontSize: "1.6rem", letterSpacing: "-0.025em" }}>Ready to Interview?</h1>
              <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>Review and confirm your details.</p>

              <div className="space-y-2.5 mb-5">
                <div className="p-3.5 rounded-xl" style={{ background: "rgba(7,9,15,0.7)", border: "1px solid var(--border-subtle)" }}>
                  <p className="label-mono mb-1">Candidate</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{candidateName}</p>
                </div>
                <div className="p-3.5 rounded-xl" style={{ background: "rgba(7,9,15,0.7)", border: "1px solid var(--border-subtle)" }}>
                  <p className="label-mono mb-1">Target Role</p>
                  <p className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <span>{ROLE_ICONS[selectedRole]}</span>
                    {ROLE_LABELS[selectedRole]}
                  </p>
                </div>
                {uploadedData?.skills && uploadedData.skills.length > 0 && (
                  <div className="p-3.5 rounded-xl" style={{ background: "rgba(7,9,15,0.7)", border: "1px solid var(--border-subtle)" }}>
                    <p className="label-mono mb-2">Your Skills</p>
                    <div className="flex flex-wrap gap-1.5">{uploadedData.skills.slice(0, 12).map((s: string) => <span key={s} className="tag-skill">{s}</span>)}</div>
                  </div>
                )}
                <div className="p-3.5 rounded-xl" style={{ background: "rgba(37,99,235,0.05)", border: "1px solid rgba(37,99,235,0.15)" }}>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Your interview will contain <strong style={{ color: "var(--text-primary)" }}>7 questions</strong> dynamically generated from ML/AI textbooks. Questions escalate in difficulty.
                  </p>
                </div>
              </div>

              {error && <div className="mb-4 text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>{error}</div>}

              <div className="flex gap-2.5">
                <button onClick={() => setStep("role")} className="btn-outline flex-1 py-3.5 rounded-xl text-sm font-semibold">← Back</button>
                <button onClick={handleStartInterview} disabled={loading}
                  className="btn-primary flex-[2] py-3.5 rounded-xl font-bold text-white text-sm" style={{ opacity: loading ? 0.5 : 1 }}>
                  {loading
                    ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Preparing...</span>
                    : "🚀 Start Interview"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}