from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.auth_service import decode_token, get_user_by_id
from app.models.user import User, UserRole

bearer = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

def require_candidate(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.candidate:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Candidates only")
    return current_user

def require_employer(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.employer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employers only")
    return current_user
