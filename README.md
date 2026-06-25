# 🧠 ScreenAI — AI-Powered Role-Based Candidate Screening System

A production-grade, full-stack candidate screening platform that conducts **dynamic AI-powered technical interviews** grounded in real ML/CS textbooks using a **RAG (Retrieval-Augmented Generation)** pipeline.

---

## 🚀 Quick Start (Local Development)

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.11+ | Backend |
| Node.js | 18+ | Frontend |
| MongoDB | 7.0 | Session storage |
| Git | any | Clone repo |

### 1. Clone & Setup

```bash
git clone <repo-url>
cd "role-based -cnd-screensys RAG"
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env and set your GEMINI_API_KEY
```

### 3. Ingest Knowledge Base (CRITICAL — run once)

The system automatically ingests any PDF files placed in the knowledge base directory.

```bash
# 1. Place your textbook PDFs into the following directory:
#    backend/knowledge_base/

# 2. From the backend/ directory, with venv active, run:
python scripts/ingest_knowledge_base.py

# Force re-ingest (if you add new PDFs later):
python scripts/ingest_knowledge_base.py --force
```

> ⚠️ **The script will recursively chunk and embed all PDFs found in the `knowledge_base` directory into the local ChromaDB.**

### 4. Start Backend

```bash
# Ensure MongoDB is running: mongod --dbpath data/
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: http://localhost:8000/docs

### 5. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend at: http://localhost:3000

---

## 🐳 Docker Compose (Recommended)

```bash
# Set your GitHub Token for OpenAI models
echo "GITHUB_TOKEN=your_token_here" > .env
echo "OPENAI_MODEL=gpt-4o" >> .env

# Start all services
docker-compose up --build

# Run ingestion (after placing PDFs in backend/knowledge_base/)
docker exec screenai_backend python scripts/ingest_knowledge_base.py
```

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14)                 │
│                                                          │
│  Landing → Resume Upload → Role Select → Interview Chat  │
│                       → Results Summary                  │
└───────────────────────────┬──────────────────────────────┘
                            │ REST API
┌───────────────────────────▼──────────────────────────────┐
│                   BACKEND (FastAPI)                      │
│                                                          │
│  ┌──────────────┐  ┌─────────────┐  ┌────────────────┐   │
│  │ ResumeService│  │  RAGService │  │InterviewService│   │
│  │  (PyMuPDF +  │  │ (Query→     │  │  (Lifecycle +  │   │
│  │   Gemini)    │  │  Retrieve→  │  │   Adaptive Q)  │   │
│  └──────┬───────┘  │  Generate)  │  └───────┬────────┘   │
│         │          └──────┬──────┘          │            │
│  ┌──────▼──────────────────────────────────────────────┐ │
│  │           Core Services                             │ │
│  │  LLMService │ EmbeddingService │ StorageService     │ │
│  │  (OpenAI)   │ (MiniLM-L6-v2)  │ (MongoDB Motor)  │  │ │
│  └──────┬──────────────────┬───────────────────────────┘ │
└─────────┼──────────────────┼─────────────────────────────┘
          │                  │
   ┌──────▼──────┐    ┌──────▼──────┐
   │  MongoDB    │    │  ChromaDB   │
   │  sessions   │    │  Per-role   │
   │  questions  │    │  collections│
   │  answers    │    │  (cosine)   │
   └─────────────┘    └─────────────┘
```

---

## 🤖 AI/ML Pipeline — Key Design Decisions

### Knowledge Ingestion

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Chunk size | 800 chars | One concept without overflow |
| Chunk overlap | 150 chars | Prevents mid-sentence cuts |
| Splitter | Recursive (`\n\n` → `\n` → `. `) | Respects paragraph/sentence structure |
| Embedding model | `all-MiniLM-L6-v2` | Fast, semantic, 384-dim, no API cost |
| Vector store | ChromaDB (cosine) | Persistent, local, no cloud dependency |
| Organization | Per-role collections | Clean filtering, no metadata overhead |

### Retrieval Mechanism

- **Query Construction**: LLM generates 4 diverse semantic queries from resume + role (not templates)
- **Retrieval**: Dense vector search against role-specific ChromaDB collection
- **Deduplication**: MMR-inspired: deduplicate by first-100-char prefix
- **Top-K**: 5 chunks per generation request

### Question Generation

- **Grounded**: Every question references specific retrieved textbook content
- **Adaptive**: Full Q&A history is passed to the LLM for follow-up context
- **Difficulty Progression**: `conceptual → conceptual → applied → applied → scenario → applied → scenario`
- **Non-generic**: LLM prompt explicitly forbids "easily Googleable" questions

### Knowledge Base Auto-Discovery

Instead of hardcoding links, the ingestion pipeline automatically discovers and embeds **any `.pdf` file** placed in the `backend/knowledge_base/` directory. This allows for seamless expansion of the knowledge base without code changes.

---

## 📁 Project Structure

```
role-based-cnd-screensys-RAG/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry + lifespan
│   │   ├── config.py            # Settings (pydantic-settings)
│   │   ├── api/routes/          # REST endpoints
│   │   │   ├── health.py
│   │   │   ├── resume.py
│   │   │   ├── sessions.py
│   │   │   └── interview.py
│   │   ├── services/            # Business logic layer
│   │   │   ├── resume_service.py
│   │   │   ├── rag_service.py   # ← Core RAG orchestrator
│   │   │   ├── interview_service.py
│   │   │   ├── llm_service.py
│   │   │   ├── embedding_service.py
│   │   │   └── storage_service.py
│   │   ├── rag/                 # RAG pipeline components
│   │   │   ├── document_loader.py
│   │   │   ├── chunker.py
│   │   │   ├── vector_store.py
│   │   │   └── prompt_templates.py
│   │   ├── models/              # Pydantic data models
│   │   └── utils/
│   ├── scripts/
│   │   └── ingest_knowledge_base.py
│   ├── knowledge_base/          # Downloaded PDFs cached here
│   ├── chroma_db/               # Persistent vector store
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Landing page
│   │   │   ├── interview/
│   │   │   │   ├── page.tsx     # Setup (3-step wizard)
│   │   │   │   └── [sessionId]/page.tsx  # Live interview
│   │   │   └── results/[sessionId]/page.tsx
│   │   ├── lib/
│   │   │   ├── api.ts           # Axios API client
│   │   │   └── types.ts         # TypeScript types
│   │   └── store/interview.ts   # Zustand state
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | System health + KB stats |
| POST | `/api/resume/upload` | Upload & parse resume |
| POST | `/api/sessions/create` | Create interview session |
| GET | `/api/sessions/{id}` | Get session metadata |
| GET | `/api/sessions/{id}/summary` | Get final analysis |
| POST | `/api/interview/{id}/start` | Begin interview (Q1) |
| POST | `/api/interview/{id}/answer/{qid}` | Submit answer, get next Q |
| GET | `/api/interview/{id}/progress` | Check progress |

Interactive docs: http://localhost:8000/docs

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

```env
GITHUB_TOKEN=             # GitHub Models Token (for OpenAI)
OPENAI_MODEL=gpt-4o       # e.g., gpt-4o, gpt-4o-mini
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=screening_db
CHROMA_PERSIST_DIR=./chroma_db
KNOWLEDGE_BASE_DIR=./knowledge_base
EMBEDDING_MODEL=all-MiniLM-L6-v2
CHUNK_SIZE=800
CHUNK_OVERLAP=150
TOP_K_RETRIEVAL=5
MAX_QUESTIONS=7
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🛠️ Tech Stack

**Backend**: FastAPI · Python 3.11 · Motor (async MongoDB) · ChromaDB · LangChain · sentence-transformers · PyMuPDF · OpenAI GPT-4o (via GitHub Models)  
**Frontend**: Next.js 14 · TypeScript · Tailwind CSS · Zustand · Axios · Framer Motion · react-dropzone

---

## 📽️ Demo Flow

1. Open http://localhost:3000
2. Click "Start Interview"
3. Upload a PDF resume → enter your name
4. Select target role (e.g., AI/ML Engineer)
5. Confirm and start
6. Answer 7 dynamically generated questions
7. View full structured results with assessment + transcript

---

## 🔧 Troubleshooting

| Issue | Fix |
|-------|-----|
| ChromaDB empty / no questions | Run `python scripts/ingest_knowledge_base.py` first |
| MongoDB connection error | Ensure `mongod` is running on port 27017 |
| OpenAI API error | Verify `GITHUB_TOKEN` in `backend/.env` |
| No PDFs found | Ensure `.pdf` files are placed inside `backend/knowledge_base/` |
| Frontend 404 on API | Verify backend is on port 8000 |
