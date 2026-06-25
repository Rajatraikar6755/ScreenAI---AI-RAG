import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from app.services.llm_service import get_llm_service
from app.services.rag_service import RAGService
from app.rag.vector_store import VectorStoreManager
from app.services.embedding_service import EmbeddingService
from app.models.resume import ResumeData
from app.config import settings

async def main():
    vs = VectorStoreManager(persist_dir=settings.CHROMA_PERSIST_DIR)
    llm = get_llm_service()
    embedder = EmbeddingService()
    rag = RAGService(vector_store=vs, llm_service=llm, embedding_service=embedder)

    resume_data = ResumeData(
        raw_text="I am a machine learning engineer with experience in deep learning and NLP.",
        candidate_name="Alice Candidate",
        skills=["Python", "PyTorch", "NLP", "Machine Learning"],
        technologies=["Transformers", "HuggingFace"],
        domains=["AI/ML Engineer"],
        experience_years=3,
        education=["MS Computer Science"],
        previous_roles=["Junior Data Scientist"],
        projects=["Built an LLM RAG pipeline"],
        summary="A passionate ML engineer."
    )
    
    print("=" * 40)
    print("TEST 1: QUESTION GENERATION (WITH RAG)")
    print("=" * 40)
    try:
        q = await rag.generate_question(
            session_id="test-session-id",
            role="ai_ml_engineer",
            resume_data=resume_data,
            question_index=0,
            conversation_history=[]
        )
        print("SUCCESS")
        print(f"Topic: {q.topic}")
        print(f"Difficulty: {q.difficulty}")
        print(f"Question: {q.question_text}")
        print(f"Sources: {q.source_books}")
        print(f"What to look for: {q.what_to_look_for}")
    except Exception as e:
        print("ERROR in Question Generation:", str(e))
        return

    print("\n" + "=" * 40)
    print("TEST 2: SESSION SUMMARY GENERATION")
    print("=" * 40)
    qa_pairs = [
        {
            "question": q.question_text,
            "topic": q.topic,
            "answer": "I would use transformers and attention mechanisms to process sequences."
        },
        {
            "question": "How do you handle overfitting in deep neural networks?",
            "topic": "Deep Learning",
            "answer": "I usually employ dropout, weight decay (L2 regularization), and early stopping."
        }
    ]
    
    try:
        summary = await rag.generate_session_summary(
            session_id="test-session-id",
            role="ai_ml_engineer",
            resume_data=resume_data,
            qa_pairs=qa_pairs
        )
        print("SUCCESS")
        print(f"Recommendation: {summary.get('recommendation')}")
        print(f"Confidence Score: {summary.get('confidence_score')}%")
        print(f"Overall Assessment: {summary.get('overall_assessment')}")
        print(f"Key Strengths: {summary.get('key_strengths')}")
        print(f"Improvement Areas: {summary.get('improvement_areas')}")
    except Exception as e:
        print("ERROR in Summary Generation:", str(e))

if __name__ == "__main__":
    asyncio.run(main())
