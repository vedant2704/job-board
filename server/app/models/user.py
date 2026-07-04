from sqlalchemy import Column, String, Enum, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.config.database import Base
from datetime import datetime
import uuid
import enum

class UserRole(str, enum.Enum):
    candidate = "candidate"
    employer = "employer"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    company_name = Column(String(200), nullable=True)  # for employers
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships added in later phases
    # jobs = relationship("Job", back_populates="employer")
    # resume = relationship("Resume", back_populates="candidate", uselist=False)
    # applications = relationship("Application", back_populates="candidate")

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "company_name": self.company_name,
            "created_at": self.created_at.isoformat(),
        }
