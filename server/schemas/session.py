from datetime import datetime
from pydantic import BaseModel, ConfigDict
from schemas.evaluation import SpeechEvaluationResponse
from schemas.topic import TopicResponse


class PracticeSessionCreate(BaseModel):
    user_id: str
    topic_id: int
    duration_seconds: float = 0.0


class PracticeSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    topic_id: int | None
    audio_url: str
    duration_seconds: float
    status: str
    error_message: str | None = None
    created_at: datetime
    topic: TopicResponse | None = None
    evaluation: SpeechEvaluationResponse | None = None


class UserProgressionDimension(BaseModel):
    dimension: str
    current_average: float
    initial_average: float
    change: float


class UserHistoryResponse(BaseModel):
    user_id: str
    total_sessions: int
    streak_days: int
    dimension_progression: list[UserProgressionDimension]
    persistent_weaknesses: list[str]
    recent_sessions: list[PracticeSessionResponse]
