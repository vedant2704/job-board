from sqlalchemy import Column, Float, Enum, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.config.database import Base
from datetime import datetime
import uuid
import enum

class ApplicationStatus(str, enum.Enum):
    pending = "pending"
    reviewed = "reviewed"
    accepted = "accepted"
    rejected = "rejected"

class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.pending)
    match_score = Column(Float, nullable=True)  # 0.0–1.0 from Pinecone cosine similarity
    applied_at = Column(DateTime, default=datetime.utcnow)

    candidate = relationship("User", backref="applications")
    job = relationship("Job", back_populates="applications")

    def to_dict(self):
        return {
            "id": str(self.id),
            "candidate_id": str(self.candidate_id),
            "job_id": str(self.job_id),
            "status": self.status,
            "match_score": self.match_score,
            "applied_at": self.applied_at.isoformat(),
        }
