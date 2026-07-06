"""
Free, local embedding + skill extraction — no external API calls or billing required.
Uses sentence-transformers (all-MiniLM-L6-v2, 384-dim) for embeddings, running
entirely on your own machine, and keyword matching for skill extraction.
"""
import asyncio
import re
from sentence_transformers import SentenceTransformer

_model = None

SKILL_KEYWORDS = [
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin",
    "React", "Vue", "Angular", "Next.js", "Node.js", "Express", "Django", "Flask", "FastAPI", "Spring",
    "HTML", "CSS", "Tailwind", "Bootstrap", "SASS",
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Firebase",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "CI/CD", "Jenkins",
    "Git", "GitHub", "GitLab",
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "NumPy",
    "REST API", "GraphQL", "WebSocket", "Microservices",
    "Linux", "Bash", "Shell Scripting",
    "Cybersecurity", "Penetration Testing", "OSINT", "Network Security", "SIEM", "Digital Forensics",
    "Agile", "Scrum", "Jira",
    "Figma", "UI/UX Design", "Zustand", "Vite", "GraphQL",
]

EMBEDDING_MODEL = "all-MiniLM-L6-v2"  # 384-dim, ~80MB, runs on CPU


def _get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBEDDING_MODEL)
    return _model


async def get_embedding(text: str) -> list[float]:
    """Convert text to a 384-dimension embedding vector using a local model (free, no API calls)."""
    text = text.replace("\n", " ").strip()[:8000]
    # sentence-transformers is CPU-bound/synchronous — run it off the event loop
    return await asyncio.to_thread(lambda: _get_model().encode(text).tolist())


def build_job_text(title: str, description: str, skills: list[str], location: str) -> str:
    """Combine job fields into one string for embedding."""
    skills_str = ", ".join(skills) if skills else ""
    return f"Job Title: {title}\nLocation: {location}\nRequired Skills: {skills_str}\n\nDescription:\n{description}"


async def extract_skills_from_resume(resume_text: str) -> list[str]:
    """
    Free, local skill extraction: matches known technical skill keywords against
    the resume text (case-insensitive, word-boundary aware). No GPT call needed.
    """
    found = []
    text_lower = resume_text.lower()
    for skill in SKILL_KEYWORDS:
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            found.append(skill)
    return found