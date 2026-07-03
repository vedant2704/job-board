from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_MINUTES: int = 10080
    OPENAI_API_KEY: str
    PINECONE_API_KEY: str
    PINECONE_INDEX: str = "job-board"
    CLIENT_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"

settings = Settings()
