"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { uploadResume, createSession } from "@/lib/api";
import { useInterviewStore } from "@/store/interview";
import { ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_ICONS, Role, ResumeData } from "@/lib/types";

const ROLES: Role[] = [
  "ai_ml_engineer",
  "backend_engineer",
  "data_scientist",
  "frontend_engineer",
];

type Step = "upload" | "role" | "confirm";

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

  // ── File Upload ─────────────────────────────────────────────────────────────
  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      setError("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "text/plain": [".txt"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleUpload = async () => {
    if (!file) return setError("Please select a resume file.");
    if (!candidateName.trim()) return setError("Please enter your name.");

    setLoading(true);
    setError("");
    try {
      const res = await uploadResume(file);
      // Override candidate name with user-entered name
      res.resume_data.candidate_name = candidateName.trim();
      setUploadedData(res.resume_data);
      setResumeData(res.resume_data);
      setStep("role");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err.response?.data?.detail || "Failed to parse resume. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Session Creation ────────────────────────────────────────────────────────
  const handleStartInterview = async () => {
    if (!selectedRole || !uploadedData) return;
    setLoading(true);
    setError("");
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-bg dot-grid flex flex-col items-center justify-center p-6">
      {/* Progress Steps */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center gap-3">
          {(["upload", "role", "confirm"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-3 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  step === s
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/40"
                    : ["upload", "role", "confirm"].indexOf(step) > i
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {["upload", "role", "confirm"].indexOf(step) > i ? "✓" : i + 1}
              </div>
              <span
                className={`text-sm font-medium capitalize ${
                  step === s ? "text-indigo-400" : "text-slate-500"
                }`}
              >
                {s === "upload" ? "Resume" : s === "role" ? "Select Role" : "Confirm"}
              </span>
              {i < 2 && <div className="flex-1 h-px bg-slate-800" />}
            </div>
          ))}
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-2xl glass rounded-2xl p-8 shadow-2xl">
        {/* ── Step 1: Upload Resume ──────────────────────────────────────── */}
        {step === "upload" && (
          <div>
            <h1 className="text-3xl font-bold mb-2">
              <span className="gradient-text">Upload Your Resume</span>
            </h1>
            <p className="text-slate-400 mb-8">
              We&apos;ll analyze your background to tailor questions specifically for you.
            </p>

            {/* Name input */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                className="w-full input-glass rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm"
              />
            </div>

            {/* Drop zone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? "border-indigo-500 bg-indigo-500/10"
                  : file
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-slate-700 hover:border-indigo-500/60 hover:bg-indigo-500/5"
              }`}
            >
              <input {...getInputProps()} />
              <div className="text-4xl mb-3">
                {file ? "✅" : isDragActive ? "📂" : "📄"}
              </div>
              {file ? (
                <div>
                  <p className="text-emerald-400 font-semibold">{file.name}</p>
                  <p className="text-slate-500 text-sm mt-1">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-slate-300 font-medium">
                    {isDragActive ? "Drop it here!" : "Drag & drop your resume"}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    PDF or TXT • Max 10MB
                  </p>
                </div>
              )}
            </div>

            {error && (
              <p className="text-red-400 text-sm mt-3 flex items-center gap-1">
                ⚠️ {error}
              </p>
            )}

            <button
              onClick={handleUpload}
              disabled={loading || !file || !candidateName.trim()}
              className="btn-primary w-full mt-6 py-3.5 rounded-xl font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing Resume...
                </span>
              ) : (
                "Parse Resume →"
              )}
            </button>
          </div>
        )}

        {/* ── Step 2: Select Role ────────────────────────────────────────── */}
        {step === "role" && (
          <div>
            <h1 className="text-3xl font-bold mb-2">
              <span className="gradient-text">Choose Your Role</span>
            </h1>
            <p className="text-slate-400 mb-6">
              Select the position you&apos;re interviewing for. We&apos;ll tailor questions to that domain.
            </p>

            {/* Extracted skills preview */}
            {uploadedData && (uploadedData.skills?.length ?? 0) > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">
                  Skills detected from your resume
                </p>
                <div className="flex flex-wrap gap-2">
                  {uploadedData.skills.slice(0, 10).map((s: string) => (
                    <span
                      key={s}
                      className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-md text-xs font-medium border border-indigo-500/30"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              {ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => setLocalRole(role)}
                  className={`w-full p-4 rounded-xl border text-left transition-all duration-200 ${
                    selectedRole === role
                      ? "border-indigo-500 bg-indigo-500/15 shadow-lg shadow-indigo-500/20"
                      : "border-slate-700 bg-slate-800/30 hover:border-indigo-500/50 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{ROLE_ICONS[role]}</span>
                    <div>
                      <p className="font-semibold text-slate-100">{ROLE_LABELS[role]}</p>
                      <p className="text-sm text-slate-400">{ROLE_DESCRIPTIONS[role]}</p>
                    </div>
                    {selectedRole === role && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-xs">
                        ✓
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {error && (
              <p className="text-red-400 text-sm mt-3">⚠️ {error}</p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep("upload")}
                className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors font-medium"
              >
                ← Back
              </button>
              <button
                onClick={() => {
                  if (!selectedRole) return setError("Please select a role.");
                  setError("");
                  setStep("confirm");
                }}
                disabled={!selectedRole}
                className="btn-primary flex-[2] py-3 rounded-xl font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Confirm & Start ────────────────────────────────────── */}
        {step === "confirm" && selectedRole && (
          <div>
            <h1 className="text-3xl font-bold mb-2">
              <span className="gradient-text">Ready to Interview?</span>
            </h1>
            <p className="text-slate-400 mb-8">
              Review your details and start when you&apos;re ready.
            </p>

            <div className="space-y-4 mb-8">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Candidate</p>
                <p className="text-slate-100 font-semibold">{candidateName}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Role</p>
                <p className="text-slate-100 font-semibold">
                  {ROLE_ICONS[selectedRole]} {ROLE_LABELS[selectedRole]}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Your Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {uploadedData?.skills?.slice(0, 12).map((s: string) => (
                    <span key={s} className="px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded text-xs border border-violet-500/30">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                <p className="text-indigo-300 text-sm">
                  🎯 The interview will have <strong>{7} questions</strong> dynamically generated
                  from ML/AI textbooks based on your profile. Questions get progressively harder.
                </p>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm mb-4">⚠️ {error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setStep("role")}
                className="flex-1 py-3.5 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors font-medium"
              >
                ← Back
              </button>
              <button
                onClick={handleStartInterview}
                disabled={loading}
                className="btn-primary flex-[2] py-3.5 rounded-xl font-bold text-white text-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Preparing Interview...
                  </span>
                ) : (
                  "🚀 Start Interview"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
