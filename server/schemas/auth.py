from datetime import datetime
from pydantic import BaseModel, ConfigDict


class GoogleAuthRequest(BaseModel):
    user_id: str
    email: str | None = None
    full_name: str | None = None
    avatar_url: str | None = None
    access_token: str | None = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str | None = None
    full_name: str | None = None
    avatar_url: str | None = None
    created_at: datetime
