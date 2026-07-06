"""
Pinecone vector database service.
- One index: "job-board" (dimension=1536, metric=cosine)
- Namespace "jobs": one vector per job listing
- Namespace "resumes": one vector per candidate resume
"""
from pinecone import Pinecone
from app.config.settings import settings

_pc = None
_index = None


def get_index():
    global _pc, _index
    if _index is None:
        _pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        _index = _pc.Index(settings.PINECONE_INDEX)
    return _index


def upsert_job(job_id: str, embedding: list[float], metadata: dict):
    """Store or update a job embedding in Pinecone."""
    index = get_index()
    index.upsert(
        vectors=[{
            "id": f"job_{job_id}",
            "values": embedding,
            "metadata": {
                "job_id": job_id,
                "title": metadata.get("title", ""),
                "company": metadata.get("company", ""),
                "location": metadata.get("location", ""),
                "job_type": metadata.get("job_type", ""),
            },
        }],
        namespace="jobs",
    )


def delete_job(job_id: str):
    """Remove a job embedding when the job is closed."""
    index = get_index()
    index.delete(ids=[f"job_{job_id}"], namespace="jobs")


def match_resume_to_jobs(resume_embedding: list[float], top_k: int = 10) -> list[dict]:
    """
    Query Pinecone with a resume embedding.
    Returns top_k most similar job vectors with cosine similarity scores.
    """
    index = get_index()
    results = index.query(
        vector=resume_embedding,
        top_k=top_k,
        namespace="jobs",
        include_metadata=True,
    )
    return [
        {
            "job_id": match.metadata.get("job_id"),
            "score": round(match.score, 4),  # cosine similarity 0.0–1.0
            "title": match.metadata.get("title"),
            "company": match.metadata.get("company"),
        }
        for match in results.matches
    ]
