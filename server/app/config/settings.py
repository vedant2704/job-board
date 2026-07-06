from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_MINUTES: int = 10080  # 7 days
    OPENAI_API_KEY: Optional[str] = None  # unused — we use free local embeddings instead
    PINECONE_API_KEY: str
    PINECONE_INDEX: str = "job-board"
    CLIENT_URL: str = "http://localhost:5173"
    ENVIRONMENT: str = "development"  # "production" on Railway

    class Config:
        env_file = ".env"

settings = Settings()