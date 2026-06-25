"""
LLM prompt templates for the RAG pipeline.

Centralised prompt management ensures consistency and makes
tuning easy without touching business logic.
"""

from string import Template


# ── Resume Extraction Prompt ──────────────────────────────────────────────────

RESUME_EXTRACTION_PROMPT = """\
You are an expert technical recruiter. Analyse the following resume text and extract structured information.

RESUME TEXT:
{resume_text}

Extract and return a JSON object with EXACTLY these keys:
{{
  "candidate_name": "Full name of the candidate or 'Candidate' if not found",
  "email": "email address or null",
  "phone": "phone number or null",
  "skills": ["list", "of", "technical", "skills"],
  "technologies": ["frameworks", "tools", "libraries", "languages"],
  "domains": ["domain areas like NLP, Computer Vision, Backend, MLOps etc."],
  "experience_years": <number or null>,
  "education": ["degree and institution"],
  "previous_roles": ["job titles held"],
  "projects": ["brief description of notable projects"],
  "summary": "One paragraph professional summary of this candidate"
}}

Return ONLY the JSON object, no markdown, no explanation.
"""


# ── Query Construction Prompt ─────────────────────────────────────────────────

QUERY_CONSTRUCTION_PROMPT = """\
You are preparing for a technical interview for a {role} position.

CANDIDATE PROFILE:
- Skills: {skills}
- Technologies: {technologies}
- Domain Expertise: {domains}
- Experience: {experience_years} years

Generate {num_queries} diverse semantic search queries to retrieve relevant technical knowledge
for evaluating this candidate. Queries should cover:
1. Core concepts the role requires
2. Technologies the candidate has listed
3. Advanced topics to probe deeper understanding

Return ONLY a JSON array of strings. Example: ["query1", "query2", "query3"]
"""


# ── Question Generation Prompt ────────────────────────────────────────────────

QUESTION_GENERATION_PROMPT = """\
You are an expert technical interviewer conducting a {role} interview.

CANDIDATE PROFILE:
{candidate_profile}

KNOWLEDGE BASE CONTEXT (retrieved from ML/CS textbooks):
{retrieved_context}

INTERVIEW HISTORY SO FAR ({questions_asked} questions asked):
{history}

INSTRUCTIONS:
Generate ONE high-quality technical interview question. The question must:
1. Be directly relevant to the {role} role
2. Draw SPECIFICALLY from the provided knowledge context (cite concepts, not just topics)
3. Be appropriate for the candidate's background (difficulty: {difficulty_level})
4. NOT be generic or easily Googleable
5. Build logically on the interview history (avoid repeating covered topics)
6. Test either: conceptual understanding, applied problem-solving, or real-world scenario reasoning

Return ONLY a JSON object with these exact keys:
{{
  "question": "The full interview question text",
  "topic": "The specific topic being tested",
  "difficulty": "conceptual|applied|scenario",
  "what_to_look_for": "Brief note on what a strong answer should contain"
}}
"""


# ── Session Summary Prompt ────────────────────────────────────────────────────

SUMMARY_GENERATION_PROMPT = """\
You are a technical hiring expert. Analyse the following interview session and generate a structured evaluation.

CANDIDATE: {candidate_name}
ROLE: {role}
EXPERIENCE: {experience_years} years
CANDIDATE SKILLS: {skills}

INTERVIEW Q&A:
{qa_pairs}

Generate a comprehensive interview summary as a JSON object with these exact keys:
{{
  "overall_assessment": "2-3 paragraph narrative assessment of the candidate's performance",
  "topic_analysis": [
    {{"topic": "topic name", "coverage": "strong|adequate|weak", "notes": "brief observation"}}
  ],
  "key_strengths": ["strength 1", "strength 2", "strength 3"],
  "improvement_areas": ["area 1", "area 2"],
  "recommendation": "Outstanding | Great | Strong Hire | Potential Hire | Needs Development",
  "confidence_score": <integer from 10 to 100>
}}

CRITICAL INSTRUCTIONS:
1. You MUST provide a valid integer for `confidence_score` between 10 and 100.
2. Even if the candidate is Outstanding, you MUST provide at least one constructive `improvement_areas` (e.g. "Minor polish needed in X", "Could explore Y deeper"). Do not leave it empty.
3. Base your assessment ONLY on the provided answers.

Return ONLY the JSON object, no markdown or explanation.
"""
