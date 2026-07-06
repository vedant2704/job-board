"""
Resume upload, skill extraction, and AI job matching endpoints.
POST /api/resume/upload  — PDF upload → text extract → GPT skills → Pinecone embed
GET  /api/resume/me      — get current candidate's resume info
GET  /api/resume/matches — get AI-matched jobs ranked by cosine similarity
"""
import io
import PyPDF2
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.middleware.auth import require_candidate
from app.models.user import User
from app.models.resume import Resume
from app.models.job import Job, JobStatus
from app.models.application import Application
from app.services.embedding_service import get_embedding, extract_skills_from_resume, build_job_text
from app.services.pinecone_service import upsert_job, match_resume_to_jobs

router = APIRouter()


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract raw text from a PDF file using PyPDF2."""
    reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text.strip()


async def process_resume_background(
    resume_id: str,
    raw_text: str,
    db_url: str,
):
    """
    Background task: extract skills with GPT + embed with OpenAI + upsert to Pinecone.
    Runs after the upload response is already sent to the client.
    """
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine(db_url)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            return

        # 1. Extract skills with GPT
        skills = await extract_skills_from_resume(raw_text)
        resume.extracted_skills = skills

        # 2. Embed resume text with OpenAI
        embedding = await get_embedding(raw_text)

        # 3. Store embedding ID
        resume.embedding_id = f"resume_{resume_id}"
        db.commit()

        print(f"[Resume] Processed resume {resume_id} — {len(skills)} skills extracted")
    except Exception as e:
        print(f"[Resume] Background processing error: {e}")
    finally:
        db.close()


@router.post("/upload")
async def upload_resume(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    candidate: User = Depends(require_candidate),
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are accepted")

    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(400, "File too large — max 5MB")

    # Extract text synchronously (fast)
    raw_text = extract_text_from_pdf(file_bytes)
    if len(raw_text) < 50:
        raise HTTPException(400, "Could not extract text from PDF. Make sure it's not a scanned image.")

    # Upsert resume record (create or replace)
    resume = db.query(Resume).filter(Resume.candidate_id == candidate.id).first()
    if resume:
        resume.filename = file.filename
        resume.raw_text = raw_text
        resume.extracted_skills = []
        resume.embedding_id = None
    else:
        resume = Resume(
            candidate_id=candidate.id,
            filename=file.filename,
            raw_text=raw_text,
        )
        db.add(resume)
    db.commit()
    db.refresh(resume)

    # Kick off background task for GPT + Pinecone (non-blocking)
    from app.config.settings import settings
    background_tasks.add_task(
        process_resume_background,
        str(resume.id),
        raw_text,
        settings.DATABASE_URL,
    )

    return {
        "message": "Resume uploaded. Skills and matches are being processed…",
        "resume": resume.to_dict(),
    }


@router.get("/me")
def get_my_resume(
    db: Session = Depends(get_db),
    candidate: User = Depends(require_candidate),
):
    resume = db.query(Resume).filter(Resume.candidate_id == candidate.id).first()
    if not resume:
        return {"resume": None}
    return {"resume": resume.to_dict()}


@router.get("/matches")
async def get_matches(
    db: Session = Depends(get_db),
    candidate: User = Depends(require_candidate),
):
    resume = db.query(Resume).filter(Resume.candidate_id == candidate.id).first()
    if not resume:
        raise HTTPException(404, "Upload your resume first to see matches")
    if not resume.embedding_id:
        raise HTTPException(202, "Resume is still being processed — check back in a moment")

    # Re-embed the resume text and query Pinecone
    embedding = await get_embedding(resume.raw_text)
    pinecone_matches = match_resume_to_jobs(embedding, top_k=10)

    if not pinecone_matches:
        return {"matches": [], "message": "No matches found yet — more jobs may be added soon"}

    # Fetch full job details from DB for matched job IDs
    job_ids = [m["job_id"] for m in pinecone_matches]
    jobs_map = {
        str(j.id): j
        for j in db.query(Job).filter(
            Job.id.in_(job_ids),
            Job.status == JobStatus.active,
        ).all()
    }

    # Check which jobs candidate already applied to
    applied_ids = {
        str(a.job_id)
        for a in db.query(Application).filter(Application.candidate_id == candidate.id).all()
    }

    # Build response — merge Pinecone scores with full job data
    results = []
    for match in pinecone_matches:
        job = jobs_map.get(match["job_id"])
        if not job:
            continue
        job_dict = job.to_dict(include_employer=True)
        job_dict["match_score"] = match["score"]
        job_dict["match_percent"] = round(match["score"] * 100)
        job_dict["already_applied"] = match["job_id"] in applied_ids
        results.append(job_dict)

    # Sort by score descending
    results.sort(key=lambda x: x["match_score"], reverse=True)

    return {
        "matches": results,
        "resume_skills": resume.extracted_skills or [],
        "total": len(results),
    }
