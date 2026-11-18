from datetime import datetime
from pydantic import BaseModel, ConfigDict


class TopicBase(BaseModel):
    category: str
    title: str
    prompt: str
    difficulty: str = "Intermediate"
    prep_time_seconds: int = 30
    speaking_time_seconds: int = 120
    suggested_framework: str | None = "PREP Framework"


class TopicCreate(TopicBase):
    pass


class TopicResponse(TopicBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    created_at: datetime


class GeneratePersonalizedTopicRequest(BaseModel):
    user_id: str
    preferred_category: str | None = None
    preferred_difficulty: str | None = None
