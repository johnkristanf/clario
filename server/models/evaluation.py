import uuid
from typing import Any
from sqlalchemy import JSON, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base, TimestampMixin


class SpeechEvaluation(Base, TimestampMixin):
    __tablename__ = "speech_evaluations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String(64), ForeignKey("practice_sessions.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)

    # 7 Dimension Scores (0-100)
    overall_score: Mapped[int] = mapped_column(Integer, default=0)
    clarity_score: Mapped[int] = mapped_column(Integer, default=0)
    structure_score: Mapped[int] = mapped_column(Integer, default=0)
    fluency_score: Mapped[int] = mapped_column(Integer, default=0)
    vocabulary_score: Mapped[int] = mapped_column(Integer, default=0)
    grammar_score: Mapped[int] = mapped_column(Integer, default=0)
    relevance_score: Mapped[int] = mapped_column(Integer, default=0)
    confidence_score: Mapped[int] = mapped_column(Integer, default=0)

    # Audio Acoustic Metrics (Librosa)
    speaking_rate_wpm: Mapped[float] = mapped_column(Float, default=0.0)
    pause_count: Mapped[int] = mapped_column(Integer, default=0)
    long_pauses_duration: Mapped[float] = mapped_column(Float, default=0.0)
    filler_words_count: Mapped[int] = mapped_column(Integer, default=0)
    filler_words_list: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    vocal_steadiness_score: Mapped[float] = mapped_column(Float, default=0.0)
    volume_variation_score: Mapped[float] = mapped_column(Float, default=0.0)

    # Transcript & Synchronized Word Timings (Deepgram)
    transcript: Mapped[str] = mapped_column(Text, default="")
    word_timings: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    pauses: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)

    # Structured AI Feedback & Guidance (OpenAI)
    strengths: Mapped[list[str]] = mapped_column(JSON, default=list)
    improvements: Mapped[list[str]] = mapped_column(JSON, default=list)
    suggested_framework: Mapped[str | None] = mapped_column(String(128), default="PREP Framework")
    framework_advice: Mapped[str | None] = mapped_column(Text, nullable=True)
    comparison_to_previous: Mapped[str | None] = mapped_column(Text, nullable=True)

    session: Mapped["PracticeSession"] = relationship("PracticeSession", back_populates="evaluation")  # noqa: F821
