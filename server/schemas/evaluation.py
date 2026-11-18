from typing import Any
from pydantic import BaseModel, ConfigDict


class WordTiming(BaseModel):
    word: str
    start: float
    end: float
    punctuated_word: str
    is_filler: bool = False
    is_repeated: bool = False


class PauseInterval(BaseModel):
    start: float
    end: float
    duration: float


class FillerWordStat(BaseModel):
    word: str
    count: int
    timestamps: list[float] = []


class SpeechEvaluationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    session_id: str

    # 7 Dimension Scores
    overall_score: int
    clarity_score: int
    structure_score: int
    fluency_score: int
    vocabulary_score: int
    grammar_score: int
    relevance_score: int
    confidence_score: int

    # Audio Acoustic Metrics
    speaking_rate_wpm: float
    pause_count: int
    long_pauses_duration: float
    filler_words_count: int
    filler_words_list: list[dict[str, Any]] = []
    vocal_steadiness_score: float
    volume_variation_score: float

    # Transcript & Timings
    transcript: str
    word_timings: list[dict[str, Any]] = []
    pauses: list[dict[str, Any]] = []

    # AI Guidance
    strengths: list[str] = []
    improvements: list[str] = []
    suggested_framework: str | None = None
    framework_advice: str | None = None
    comparison_to_previous: str | None = None


class EvaluationJobStatus(BaseModel):
    session_id: str
    status: str  # processing | completed | failed
    stage: str | None = None  # transcribing | analyzing_acoustics | evaluating | done
    progress: int = 0  # 0 to 100
    error_message: str | None = None
    evaluation: SpeechEvaluationResponse | None = None
