from sqlalchemy import Column, String, Text, Enum, DateTime, Integer, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.config.database import Base
from datetime import datetime
import uuid
import enum

class JobType(str, enum.Enum):
    full_time = "full_time"
    part_time = "part_time"
    contract = "contract"
    remote = "remote"
    internship = "internship"

class JobStatus(str, enum.Enum):
    active = "active"
    closed = "closed"

class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(200), nullable=False)
    company = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(200), nullable=False)
    job_type = Column(Enum(JobType), nullable=False, default=JobType.full_time)
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    skills_required = Column(ARRAY(String), default=[])
    experience_years = Column(Integer, default=0)
    status = Column(Enum(JobStatus), default=JobStatus.active)
    employer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employer = relationship("User", backref="jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")

    def to_dict(self, include_employer=False):
        d = {
            "id": str(self.id),
            "title": self.title,
            "company": self.company,
            "description": self.description,
            "location": self.location,
            "job_type": self.job_type,
            "salary_min": self.salary_min,
            "salary_max": self.salary_max,
            "skills_required": self.skills_required or [],
            "experience_years": self.experience_years,
            "status": self.status,
            "employer_id": str(self.employer_id),
            "created_at": self.created_at.isoformat(),
        }
        if include_employer and self.employer:
            d["employer"] = {"name": self.employer.name, "company": self.employer.company_name}
        return d
