from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.config.database import Base
from datetime import datetime
import uuid

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    filename = Column(String(255), nullable=False)
    raw_text = Column(Text, nullable=False)
    extracted_skills = Column(JSON, default=[])   # GPT-extracted skill list
    embedding_id = Column(String(100), nullable=True)  # Pinecone vector ID
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    candidate = relationship("User", backref="resume")

    def to_dict(self):
        return {
            "id": str(self.id),
            "candidate_id": str(self.candidate_id),
            "filename": self.filename,
            "extracted_skills": self.extracted_skills or [],
            "embedding_id": self.embedding_id,
            "uploaded_at": self.uploaded_at.isoformat(),
        }
