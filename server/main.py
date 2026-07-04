from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.config.database import Base, engine
from app.routes import auth

# Auto-create all tables on startup (use Alembic for production)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="JobMatch API",
    description="AI-powered job board with semantic resume matching",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CLIENT_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "service": "jobmatch-api"}

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
# Phase 3+
# app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
# app.include_router(resume.router, prefix="/api/resume", tags=["Resume"])
