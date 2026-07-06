from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from typing import Optional
from app.config.database import get_db
from app.models.job import Job, JobType, JobStatus
from app.models.application import Application, ApplicationStatus
from app.models.resume import Resume
from app.middleware.auth import get_current_user, require_employer, require_candidate
from app.models.user import User

router = APIRouter()

# ── Schemas ──────────────────────────────────────────────────────────────────

class JobCreate(BaseModel):
    title: str
    description: str
    location: str
    job_type: JobType = JobType.full_time
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    skills_required: list[str] = []
    experience_years: int = 0

class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[JobType] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    skills_required: Optional[list[str]] = None
    experience_years: Optional[int] = None
    status: Optional[JobStatus] = None

# ── Public endpoints ──────────────────────────────────────────────────────────

@router.get("/")
def list_jobs(
    search: Optional[str] = Query(None),
    job_type: Optional[JobType] = Query(None),
    location: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    q = db.query(Job).filter(Job.status == JobStatus.active)
    if search:
        q = q.filter(or_(
            Job.title.ilike(f"%{search}%"),
            Job.description.ilike(f"%{search}%"),
            Job.company.ilike(f"%{search}%"),
        ))
    if job_type:
        q = q.filter(Job.job_type == job_type)
    if location:
        q = q.filter(Job.location.ilike(f"%{location}%"))

    total = q.count()
    jobs = q.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "jobs": [j.to_dict(include_employer=True) for j in jobs],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/employer/my-jobs")
def my_jobs(
    db: Session = Depends(get_db),
    employer: User = Depends(require_employer),
):
    jobs = db.query(Job).filter(
        Job.employer_id == employer.id
    ).order_by(Job.created_at.desc()).all()

    result = []
    for job in jobs:
        d = job.to_dict()
        d["applicant_count"] = len(job.applications)
        result.append(d)
    return {"jobs": result}


@router.get("/candidate/my-applications")
def my_applications(
    db: Session = Depends(get_db),
    candidate: User = Depends(require_candidate),
):
    apps = db.query(Application).filter(
        Application.candidate_id == candidate.id
    ).order_by(Application.applied_at.desc()).all()
    result = []
    for app in apps:
        d = app.to_dict()
        if app.job:
            d["job"] = app.job.to_dict()
        result.append(d)
    return {"applications": result}


@router.get("/{job_id}")
def get_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    return job.to_dict(include_employer=True)


# ── Employer endpoints ────────────────────────────────────────────────────────

@router.post("/", status_code=201)
def create_job(
    background_tasks: BackgroundTasks,
    body: JobCreate,
    db: Session = Depends(get_db),
    employer: User = Depends(require_employer),
):
    job = Job(
        **body.model_dump(),
        company=employer.company_name or employer.name,
        employer_id=employer.id,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Embed job in background so API responds instantly
    background_tasks.add_task(
        embed_job_background,
        str(job.id),
        job.title,
        job.description,
        job.skills_required or [],
        job.location,
        job.company,
        job.job_type,
    )
    return job.to_dict()


@router.patch("/{job_id}")
def update_job(
    job_id: str,
    body: JobUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    employer: User = Depends(require_employer),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    if str(job.employer_id) != str(employer.id):
        raise HTTPException(403, "Not your job listing")

    updated_fields = body.model_dump(exclude_none=True)
    for field, value in updated_fields.items():
        setattr(job, field, value)
    db.commit()
    db.refresh(job)

    # Re-embed if any content-relevant field changed, or drop from Pinecone if closed
    content_fields = {"title", "description", "location", "skills_required"}
    if job.status == JobStatus.closed:
        background_tasks.add_task(remove_job_embedding_background, str(job.id))
    elif content_fields & updated_fields.keys():
        background_tasks.add_task(
            embed_job_background,
            str(job.id), job.title, job.description, job.skills_required or [],
            job.location, job.company, job.job_type,
        )
    return job.to_dict()


@router.delete("/{job_id}")
def delete_job(
    job_id: str,
    db: Session = Depends(get_db),
    employer: User = Depends(require_employer),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    if str(job.employer_id) != str(employer.id):
        raise HTTPException(403, "Not your job listing")
    job.status = JobStatus.closed
    db.commit()

    # Remove from Pinecone
    try:
        from app.services.pinecone_service import delete_job as _delete_job
        _delete_job(job_id)
    except Exception:
        pass
    return {"message": "Job closed"}


@router.get("/{job_id}/applicants")
def get_applicants(
    job_id: str,
    db: Session = Depends(get_db),
    employer: User = Depends(require_employer),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job or str(job.employer_id) != str(employer.id):
        raise HTTPException(403, "Access denied")

    apps = (
        db.query(Application)
        .filter(Application.job_id == job_id)
        .order_by(Application.match_score.desc().nullslast(), Application.applied_at.desc())
        .all()
    )
    result = []
    for app in apps:
        d = app.to_dict()
        if app.candidate:
            d["candidate"] = {
                "id": str(app.candidate.id),
                "name": app.candidate.name,
                "email": app.candidate.email,
            }
            # Include candidate's extracted skills if resume exists
            resume = db.query(Resume).filter(Resume.candidate_id == app.candidate_id).first()
            if resume:
                d["candidate"]["skills"] = resume.extracted_skills or []
                d["candidate"]["resume_filename"] = resume.filename
        result.append(d)

    return {
        "job": job.to_dict(),
        "applicants": result,
        "total": len(result),
    }


@router.patch("/{job_id}/applicants/{application_id}")
def update_application_status(
    job_id: str,
    application_id: str,
    status: ApplicationStatus,
    db: Session = Depends(get_db),
    employer: User = Depends(require_employer),
):
    app = db.query(Application).filter(
        Application.id == application_id,
        Application.job_id == job_id,
    ).first()
    if not app:
        raise HTTPException(404, "Application not found")
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job or str(job.employer_id) != str(employer.id):
        raise HTTPException(403, "Access denied")
    app.status = status
    db.commit()
    return {"message": f"Status updated to {status}"}


# ── Candidate endpoints ───────────────────────────────────────────────────────

@router.post("/{job_id}/apply")
async def apply_to_job(
    job_id: str,
    db: Session = Depends(get_db),
    candidate: User = Depends(require_candidate),
):
    job = db.query(Job).filter(Job.id == job_id, Job.status == JobStatus.active).first()
    if not job:
        raise HTTPException(404, "Job not found or closed")

    existing = db.query(Application).filter(
        Application.candidate_id == candidate.id,
        Application.job_id == job_id,
    ).first()
    if existing:
        raise HTTPException(409, "Already applied to this job")

    # Compute match score at apply time if candidate has a resume
    match_score = None
    try:
        resume = db.query(Resume).filter(Resume.candidate_id == candidate.id).first()
        if resume and resume.raw_text:
            from app.services.embedding_service import get_embedding, build_job_text
            from app.services.pinecone_service import match_resume_to_jobs

            resume_embedding = await get_embedding(resume.raw_text)
            matches = match_resume_to_jobs(resume_embedding, top_k=50)
            for m in matches:
                if m["job_id"] == job_id:
                    match_score = m["score"]
                    break
    except Exception as e:
        print(f"[Apply] Match score computation failed: {e}")

    application = Application(
        candidate_id=candidate.id,
        job_id=job_id,
        match_score=match_score,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application.to_dict()


# ── Background embedding ──────────────────────────────────────────────────────

async def embed_job_background(
    job_id: str, title: str, description: str,
    skills: list, location: str, company: str, job_type: str,
):
    try:
        from app.services.embedding_service import get_embedding, build_job_text
        from app.services.pinecone_service import upsert_job as _upsert_job

        text = build_job_text(title, description, skills, location)
        embedding = await get_embedding(text)
        _upsert_job(job_id, embedding, {
            "title": title, "company": company,
            "location": location, "job_type": job_type,
        })
        print(f"[Jobs] Embedded job {job_id}")
    except Exception as e:
        print(f"[Jobs] Embedding error for {job_id}: {e}")


async def remove_job_embedding_background(job_id: str):
    """Remove a job's embedding from Pinecone when it's closed."""
    try:
        from app.services.pinecone_service import delete_job as _delete_job
        _delete_job(job_id)
        print(f"[Jobs] Removed embedding for closed job {job_id}")
    except Exception as e:
        print(f"[Jobs] Removal error for {job_id}: {e}")