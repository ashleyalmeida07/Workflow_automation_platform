from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from auth.schemas import (
    RegisterRequest,
    LoginRequest,
    GoogleLoginRequest,
    UserResponse,
    TokenResponse,
)
from auth.security import hash_password, verify_password, create_access_token
from auth.dependencies import get_current_user
import urllib.request
import json
from app.config import settings


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/register", response_model=UserResponse)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):
    existing_user = db.query(User).filter(
        User.email == data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    hashed_password = hash_password(data.password)

    user = User(
        name=data.name,
        email=data.email,
        password=hashed_password,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user

@router.post("/login", response_model=TokenResponse)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(
        User.email == data.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

@router.post("/google", response_model=TokenResponse)
def google_login(
    data: GoogleLoginRequest,
    db: Session = Depends(get_db),
):
    try:
        # Verify the Google access token by fetching user info
        req = urllib.request.Request(f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={data.credential}")
        with urllib.request.urlopen(req) as response:
            idinfo = json.loads(response.read().decode())
        
        email = idinfo['email']
        name = idinfo.get('name', 'Google User')
        
        user = db.query(User).filter(User.email == email).first()
        
        # If user doesn't exist, create them
        if not user:
            user = User(
                name=name,
                email=email,
                password=None,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
        access_token = create_access_token(user.id)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
        }
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )

@router.get("/profile", response_model=UserResponse)
def profile(
    current_user: User = Depends(get_current_user),
):
    return current_user

    