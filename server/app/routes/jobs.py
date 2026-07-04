from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from typing import Optional
from app.config.database import get_db
from app.models.job import Job, JobType, JobStatus
from app.models.application import Application, ApplicationStatus
from app.middleware.auth import get_current_user, require_employer, require_candidate
from app.models.user import User
import uuid

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


@router.get("/{job_id}")
def get_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    return job.to_dict(include_employer=True)

# ── Employer endpoints ────────────────────────────────────────────────────────

@router.post("/", status_code=201)
def create_job(
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
    # Phase 4: trigger embedding in background
    return job.to_dict()


@router.patch("/{job_id}")
def update_job(
    job_id: str,
    body: JobUpdate,
    db: Session = Depends(get_db),
    employer: User = Depends(require_employer),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    if str(job.employer_id) != str(employer.id):
        raise HTTPException(403, "Not your job listing")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(job, field, value)
    db.commit()
    db.refresh(job)
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
    return {"message": "Job closed"}


@router.get("/employer/my-jobs")
def my_jobs(
    db: Session = Depends(get_db),
    employer: User = Depends(require_employer),
):
    jobs = db.query(Job).filter(Job.employer_id == employer.id).order_by(Job.created_at.desc()).all()
    return {"jobs": [j.to_dict() for j in jobs]}


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
        .order_by(Application.match_score.desc().nullslast())
        .all()
    )
    result = []
    for app in apps:
        d = app.to_dict()
        if app.candidate:
            d["candidate"] = {
                "name": app.candidate.name,
                "email": app.candidate.email,
            }
        result.append(d)
    return {"applicants": result}

# ── Candidate endpoints ───────────────────────────────────────────────────────

@router.post("/{job_id}/apply")
def apply_to_job(
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

    application = Application(candidate_id=candidate.id, job_id=job_id)
    db.add(application)
    db.commit()
    db.refresh(application)
    return application.to_dict()


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


@router.patch("/{job_id}/applicants/{application_id}")
def update_application_status(
    job_id: str,
    application_id: str,
    status: ApplicationStatus,
    db: Session = Depends(get_db),
    employer: User = Depends(require_employer),
):
    app = db.query(Application).filter(Application.id == application_id, Application.job_id == job_id).first()
    if not app:
        raise HTTPException(404, "Application not found")
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job or str(job.employer_id) != str(employer.id):
        raise HTTPException(403, "Access denied")
    app.status = status
    db.commit()
    return {"message": f"Status updated to {status}"}
