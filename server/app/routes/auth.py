from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.config.database import get_db
from app.models.user import UserRole
from app.services.auth_service import (
    get_user_by_email, register_user, verify_password, create_token
)
from app.middleware.auth import get_current_user
from app.models.user import User

router = APIRouter()

# ── Schemas ──────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole
    company_name: Optional[str] = None  # required for employers

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    token: str
    user: dict

# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/register", response_model=AuthResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if len(body.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")

    if body.role == UserRole.employer and not body.company_name:
        raise HTTPException(400, "Company name is required for employers")

    if get_user_by_email(db, body.email):
        raise HTTPException(409, "Email already registered")

    user = register_user(
        db=db,
        name=body.name,
        email=body.email,
        password=body.password,
        role=body.role,
        company_name=body.company_name,
    )
    return {"token": create_token(str(user.id)), "user": user.to_dict()}


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, body.email)
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")
    if not user.is_active:
        raise HTTPException(403, "Account disabled")
    return {"token": create_token(str(user.id)), "user": user.to_dict()}


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {"user": current_user.to_dict()}