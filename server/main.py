from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings

app = FastAPI(
    title="Job Board API",
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
    return {"status": "ok", "service": "job-board-api"}

# Routes registered in Phase 2+
# from app.routes import auth, jobs, resume
# app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
# app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])
# app.include_router(resume.router, prefix="/api/resume", tags=["resume"])
