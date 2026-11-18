from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.security import get_uid_from_token
from db.session import get_db
from models.user import User
from schemas.auth import GoogleAuthRequest, UserResponse
from services.supabase import verify_supabase_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/google", response_model=UserResponse)
async def handle_google_signin(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    user_id = req.user_id
    email = req.email
    full_name = req.full_name or "Clario Speaker"
    avatar_url = req.avatar_url

    # Verify access token: local JWT decode first (fast, no network), then Auth API fallback
    if req.access_token:
        local_uid = get_uid_from_token(req.access_token)
        if local_uid:
            user_id = local_uid
        else:
            # Fallback: verify via Supabase Auth API (covers missing JWT secret case)
            verified = await verify_supabase_user(req.access_token)
            if verified:
                user_id = verified.get("id", user_id)
                email = verified.get("email") or email
                meta = verified.get("user_metadata") or {}
                full_name = meta.get("full_name") or meta.get("name") or full_name
                avatar_url = meta.get("avatar_url") or avatar_url

    user = db.get(User, user_id)
    if not user:
        user = User(
            id=user_id,
            email=email,
            full_name=full_name,
            avatar_url=avatar_url,
            auth_provider="supabase_google",
        )
        db.add(user)
    else:
        if email:
            user.email = email
        if full_name:
            user.full_name = full_name
        if avatar_url:
            user.avatar_url = avatar_url

    db.commit()
    db.refresh(user)
    return user


@router.get("/me/{user_id}", response_model=UserResponse)
def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        # Auto-create profile if guest
        user = User(id=user_id, full_name="Clario Speaker")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
