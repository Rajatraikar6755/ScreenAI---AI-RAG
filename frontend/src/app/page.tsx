"use client";

import Link from "next/link";

const FEATURES = [
  {
    icon: "📄",
    title: "Resume-Aware Questions",
    desc: "Your skills, domain experience, and background directly influence every question asked.",
  },
  {
    icon: "📚",
    title: "RAG Knowledge Pipeline",
    desc: "Questions are grounded in ML/CS textbooks — Mitchell, Bishop, Burkov, and more.",
  },
  {
    icon: "🎯",
    title: "Adaptive Difficulty",
    desc: "Starts conceptual, escalates to applied and scenario-based as the interview progresses.",
  },
  {
    icon: "💾",
    title: "Full Transcript & Analysis",
    desc: "Every session is stored with complete traceability — see which books influenced each question.",
  },
  {
    icon: "🤖",
    title: "Open AI GPT 04 Intelligence",
    desc: "State-of-the-art LLM generates non-generic, deeply relevant technical questions.",
  },
  {
    icon: "🔄",
    title: "Adaptive Follow-Ups",
    desc: "The AI reads your previous answers to pivot, probe deeper, or explore new angles.",
  },
];

const ROLES = [
  { icon: "🤖", name: "AI/ML Engineer", color: "from-violet-500 to-purple-600" },
  { icon: "⚙️", name: "Backend Engineer", color: "from-blue-500 to-cyan-600" },
  { icon: "📊", name: "Data Scientist", color: "from-emerald-500 to-teal-600" },
  { icon: "🎨", name: "Frontend Engineer", color: "from-rose-500 to-pink-600" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Upload Resume", desc: "We parse your PDF and extract skills, technologies, and experience with Open AI GPT 04." },
  { step: "02", title: "Select Role", desc: "Choose the position you're targeting. The knowledge base is filtered to that domain." },
  { step: "03", title: "RAG Retrieval", desc: "Your profile generates queries that retrieve relevant chunks from ML textbooks via ChromaDB." },
  { step: "04", title: "Live Interview", desc: "Answer 7 progressively harder questions in a chat interface. Your answers adapt the next question." },
  { step: "05", title: "Structured Report", desc: "Receive a detailed assessment with strengths, improvement areas, and a recommendation verdict." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            <span className="font-bold text-lg gradient-text">ScreenAI</span>
          </div>
          <Link
            href="/interview"
            className="btn-primary px-5 py-2 rounded-xl text-sm font-semibold text-white"
          >
            Start Interview →
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="animated-bg dot-grid min-h-screen flex flex-col items-center justify-center px-6 pt-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-indigo-400 pulse-dot" />
            Powered by RAG + Open AI GPT 04
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            <span className="gradient-text">AI-Powered</span>
            <br />
            <span className="text-slate-100">Technical Screening</span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your resume. Select a role. Experience a dynamic technical interview where every
            question is uniquely generated from ML/CS textbooks, grounded in your background.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/interview"
              className="btn-primary px-8 py-4 rounded-xl text-white font-bold text-lg"
            >
              🚀 Start Your Interview
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-4 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors font-semibold text-lg"
            >
              Learn How It Works ↓
            </a>
          </div>

          {/* Role chips */}
          <div className="flex flex-wrap gap-3 justify-center">
              {ROLES.map((r) => (
              <div
                key={r.name}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${r.color} bg-opacity-10 border border-white/10 text-sm font-medium`}
              >
                <span>{r.icon}</span>
                <span>{r.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 animate-bounce text-slate-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              <span className="gradient-text">Why ScreenAI?</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Not another quiz generator. A genuine AI interviewer that reads, understands, and adapts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="glass rounded-2xl p-6 border border-white/5 hover:border-indigo-500/30 transition-all duration-300 group"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2 group-hover:text-indigo-300 transition-colors">
                  {f.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              <span className="gradient-text-blue">How It Works</span>
            </h2>
            <p className="text-slate-400 text-lg">
              A complete RAG pipeline from resume to structured report.
            </p>
          </div>

          <div className="relative space-y-4">
            {/* Vertical line */}
            <div className="absolute left-7 top-8 bottom-8 w-px bg-gradient-to-b from-indigo-500 via-violet-500 to-transparent" />

            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="flex gap-6 items-start pl-2">
                <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-lg shadow-indigo-500/40">
                  {step.step}
                </div>
                <div className="glass rounded-xl p-5 flex-1 border border-white/5">
                  <h3 className="font-semibold text-slate-100 mb-1">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RAG Architecture Section ──────────────────────────────────────── */}
      <section className="py-24 px-6 bg-slate-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              <span className="gradient-text">RAG Architecture</span>
            </h2>
            <p className="text-slate-400">
              Questions are grounded — not hallucinated. Every question cites its textbook source.
            </p>
          </div>

          <div className="glass rounded-2xl p-8 border border-indigo-500/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Knowledge Base",
                  icon: "📚",
                  items: ["Tom Mitchell – ML", "Burkov – 100-Page ML", "Bishop – PRML", "Intro to ML with Python", "Jason Brownlee – Master ML Algorithms"],
                  color: "indigo",
                },
                {
                  title: "Pipeline",
                  icon: "⚙️",
                  items: ["PDF → PyMuPDF", "Recursive Chunking (800 chars)", "Embeddings: MiniLM-L6-v2", "Vector Store: ChromaDB", "Retrieval: MMR Top-5"],
                  color: "violet",
                },
                {
                  title: "Generation",
                  icon: "🤖",
                  items: ["Resume → LLM queries", "Role-filtered retrieval", "Open AI GPT 04 synthesis", "Adaptive follow-ups", "Structured JSON output"],
                  color: "purple",
                },
              ].map((col) => (
                <div key={col.title}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">{col.icon}</span>
                    <h3 className="font-semibold text-slate-200">{col.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {col.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="text-indigo-400 mt-0.5">▸</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 animated-bg border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Ready to be screened?</span>
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            No preparation needed. Just upload your resume and let the AI do the rest.
          </p>
          <Link
            href="/interview"
            className="btn-primary inline-block px-10 py-5 rounded-xl text-white font-bold text-xl"
          >
            🚀 Begin Interview Now
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="py-8 px-6 border-t border-white/5 text-center text-slate-600 text-sm">
        <p>
          ScreenAI — AI-Powered Role-Based Candidate Screening System • Built with FastAPI + Next.js + ChromaDB + Open AI GPT 04
        </p>
      </footer>
    </div>
  );
}
