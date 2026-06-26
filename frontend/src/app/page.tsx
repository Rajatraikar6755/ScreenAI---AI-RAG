"use client";

import Link from "next/link";

const FEATURES = [
  {
    icon: "📄",
    title: "Resume-Aware Questions",
    desc: "Your skills, domain experience, and background directly influence every question asked.",
    badge: "Personalized",
  },
  {
    icon: "📚",
    title: "RAG Knowledge Pipeline",
    desc: "Questions are grounded in ML/CS textbooks — Mitchell, Bishop, Burkov, and more.",
    badge: "Verified",
  },
  {
    icon: "🎯",
    title: "Adaptive Difficulty",
    desc: "Starts conceptual, escalates to applied and scenario-based as the interview progresses.",
    badge: "Smart",
  },
  {
    icon: "💾",
    title: "Full Transcript & Analysis",
    desc: "Every session is stored with complete traceability — see which books influenced each question.",
    badge: "Trackable",
  },
  {
    icon: "🤖",
    title: "GPT-4o Intelligence",
    desc: "State-of-the-art LLM generates non-generic, deeply relevant technical questions.",
    badge: "AI-Powered",
  },
  {
    icon: "🔄",
    title: "Adaptive Follow-Ups",
    desc: "The AI reads your previous answers to pivot, probe deeper, or explore new angles.",
    badge: "Dynamic",
  },
];

const ROLES = [
  { icon: "🤖", name: "AI/ML Engineer" },
  { icon: "⚙️", name: "Backend Engineer" },
  { icon: "📊", name: "Data Scientist" },
  { icon: "🎨", name: "Frontend Engineer" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Upload Resume", desc: "We parse your PDF and extract skills, technologies, and experience with GPT-4o." },
  { step: "02", title: "Select Role", desc: "Choose the position you're targeting. The knowledge base is filtered to that domain." },
  { step: "03", title: "RAG Retrieval", desc: "Your profile generates queries that retrieve relevant chunks from ML textbooks via ChromaDB." },
  { step: "04", title: "Live Interview", desc: "Answer 7 progressively harder questions in a chat interface. Your answers adapt the next question." },
  { step: "05", title: "Structured Report", desc: "Receive a detailed assessment with strengths, improvement areas, and a recommendation verdict." },
];

const STATS = [
  { value: "7", label: "Interview Questions", sub: "per session" },
  { value: "5+", label: "ML/CS Textbooks", sub: "as knowledge base" },
  { value: "4", label: "Engineering Roles", sub: "supported" },
  { value: "∞", label: "Unique Interviews", sub: "every session is different" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen text-slate-100" style={{ background: "var(--bg-base)" }}>
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
              style={{ background: "#1d4ed8" }}
            >
              🧠
            </div>
            <span className="font-bold text-base" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
              Screen<span className="gradient-text">AI</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-7 text-sm" style={{ color: "var(--text-secondary)" }}>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
          </div>
          <Link
            href="/interview"
            className="btn-primary px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
          >
            Get Started →
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="animated-bg min-h-screen flex flex-col items-center justify-center px-6 pt-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Live badge */}
          <div
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-medium mb-10"
            style={{
              background: "rgba(37,99,235,0.08)",
              border: "1px solid rgba(37,99,235,0.2)",
              color: "#93c5fd",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot flex-shrink-0" />
            Live · Powered by RAG + GPT-4o + ChromaDB
          </div>

          <h1
            className="font-extrabold leading-[1.08] mb-6"
            style={{ fontSize: "clamp(2.8rem, 7vw, 5rem)", letterSpacing: "-0.03em" }}
          >
            <span className="gradient-text">AI-Powered</span>
            <br />
            <span style={{ color: "var(--text-primary)" }}>Technical Screening</span>
          </h1>

          <p
            className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Upload your resume. Select a role. Experience a dynamic interview
            where every question is uniquely generated from ML/CS textbooks,
            grounded in your background.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
            <Link
              href="/interview"
              className="btn-primary px-8 py-4 rounded-xl text-white font-bold text-base"
            >
              🚀 Start Your Interview
            </Link>
            <a
              href="#how-it-works"
              className="btn-outline px-8 py-4 rounded-xl font-semibold text-base"
            >
              Learn How It Works ↓
            </a>
          </div>

          {/* Role chips */}
          <div className="flex flex-wrap gap-2.5 justify-center">
            {ROLES.map((r) => (
              <div
                key={r.name}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                }}
              >
                <span>{r.icon}</span>
                <span>{r.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll caret */}
        <div className="mt-20 animate-bounce" style={{ color: "var(--text-muted)" }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <section className="py-14 px-6 border-y" style={{ borderColor: "var(--border-subtle)", background: "rgba(255,255,255,0.012)" }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-extrabold text-4xl gradient-text mb-1" style={{ letterSpacing: "-0.04em" }}>{s.value}</p>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{s.label}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 grid-bg">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="label-mono mb-3">Why ScreenAI</div>
            <h2
              className="font-bold mb-3"
              style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", letterSpacing: "-0.025em", color: "var(--text-primary)" }}
            >
              Not just another{" "}
              <span className="gradient-text">quiz generator</span>
            </h2>
            <div className="section-divider mt-5" />
            <p className="text-base mt-5 max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              A genuine AI interviewer that reads, understands, and adapts to your unique background.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="glass rounded-xl p-5 card-hover"
                style={{ border: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.14)" }}
                  >
                    {f.icon}
                  </div>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: "rgba(37,99,235,0.08)",
                      color: "#93c5fd",
                      border: "1px solid rgba(37,99,235,0.15)",
                    }}
                  >
                    {f.badge}
                  </span>
                </div>
                <h3 className="font-semibold text-sm mb-1.5" style={{ color: "var(--text-primary)" }}>{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6" style={{ background: "var(--bg-surface)" }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14">
            <div className="label-mono mb-3">Process</div>
            <h2
              className="font-bold mb-3"
              style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", letterSpacing: "-0.025em", color: "var(--text-primary)" }}
            >
              <span className="gradient-text-blue">How It Works</span>
            </h2>
            <div className="section-divider mt-5" />
            <p className="text-base mt-5" style={{ color: "var(--text-secondary)" }}>
              A complete RAG pipeline — from resume to structured report.
            </p>
          </div>

          <div className="relative space-y-3">
            <div
              className="absolute left-6 top-8 bottom-4 w-px"
              style={{ background: "linear-gradient(to bottom, rgba(37,99,235,0.4), rgba(37,99,235,0.04))" }}
            />
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="flex gap-5 items-start">
                <div
                  className="relative z-10 w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: "#1d4ed8",
                    boxShadow: "0 0 0 4px rgba(29,78,216,0.12)",
                    color: "white",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {step.step}
                </div>
                <div
                  className="glass rounded-xl p-4 flex-1"
                  style={{ border: "1px solid var(--border-subtle)" }}
                >
                  <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--text-primary)" }}>{step.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RAG Architecture ─────────────────────────────────────────────── */}
      <section id="architecture" className="py-24 px-6 grid-bg">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="label-mono mb-3">Under the hood</div>
            <h2
              className="font-bold mb-3"
              style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", letterSpacing: "-0.025em", color: "var(--text-primary)" }}
            >
              <span className="gradient-text">RAG Architecture</span>
            </h2>
            <div className="section-divider mt-5" />
            <p className="text-base mt-5" style={{ color: "var(--text-secondary)" }}>
              Questions are grounded — not hallucinated. Every question cites its textbook source.
            </p>
          </div>

          <div
            className="glass rounded-2xl p-8"
            style={{ border: "1px solid var(--border-subtle)" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Knowledge Base",
                  icon: "📚",
                  items: ["Tom Mitchell – ML", "Burkov – 100-Page ML", "Bishop – PRML", "Intro to ML with Python", "Jason Brownlee – Algorithms"],
                },
                {
                  title: "Pipeline",
                  icon: "⚙️",
                  items: ["PDF → PyMuPDF", "Recursive Chunking (800 chars)", "Embeddings: MiniLM-L6-v2", "Vector Store: ChromaDB", "Retrieval: MMR Top-5"],
                },
                {
                  title: "Generation",
                  icon: "🤖",
                  items: ["Resume → LLM queries", "Role-filtered retrieval", "GPT-4o synthesis", "Adaptive follow-ups", "Structured JSON output"],
                },
              ].map((col, ci) => (
                <div key={col.title}>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                      style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.18)" }}
                    >
                      {col.icon}
                    </div>
                    <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{col.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {col.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <span className="mt-0.5 flex-shrink-0" style={{ color: "#60a5fa" }}>▸</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  {ci < 2 && (
                    <div className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 items-center" style={{ color: "var(--text-muted)" }}>→</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 animated-bg border-t" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="max-w-xl mx-auto text-center">
          <div className="label-mono mb-4">Ready?</div>
          <h2
            className="font-bold mb-4"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", letterSpacing: "-0.025em", color: "var(--text-primary)" }}
          >
            Start your interview <span className="gradient-text">now</span>
          </h2>
          <p className="text-base mb-8" style={{ color: "var(--text-secondary)" }}>
            No preparation needed. Just upload your resume and let the AI do the rest.
          </p>
          <Link
            href="/interview"
            className="btn-primary inline-block px-10 py-4 rounded-xl text-white font-bold text-base"
          >
            🚀 Begin Interview
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="py-8 px-6 border-t text-center text-xs" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
        <p>ScreenAI — AI-Powered Role-Based Candidate Screening System · FastAPI + Next.js + ChromaDB + GPT-4o</p>
      </footer>
    </div>
  );
}