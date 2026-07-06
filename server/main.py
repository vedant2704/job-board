from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config.settings import settings
from app.config.database import Base, engine
from app.routes import auth, jobs, resume

# Register all models before create_all
from app.models import user, job, application, resume as resume_model  # noqa

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="JobMatch API",
    description="AI-powered job board with semantic resume matching",
    version="1.0.0",
    # Hide docs in production
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url=None,
)

# Allow both local dev and production Vercel URL
allowed_origins = list(filter(None, [
    "http://localhost:5173",
    "http://localhost:3000",
    settings.CLIENT_URL,
]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler — never expose stack traces in production
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if settings.ENVIRONMENT == "development":
        raise exc
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "jobmatch-api",
        "environment": settings.ENVIRONMENT,
    }

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(resume.router, prefix="/api/resume", tags=["Resume"])