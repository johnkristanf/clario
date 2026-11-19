import uuid
from sqlalchemy import Float, ForeignKey, Index, Integer, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base, TimestampMixin


class PracticeSession(Base, TimestampMixin):
    __tablename__ = "practice_sessions"
    __table_args__ = (
        Index("idx_practice_sessions_created_at", text("created_at desc")),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    topic_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("topics.id", ondelete="SET NULL"), index=True, nullable=True)
    audio_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    duration_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(32), default="processing", index=True)  # processing | completed | failed
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="sessions")  # noqa: F821
    topic: Mapped["Topic"] = relationship("Topic", back_populates="sessions")  # noqa: F821
    evaluation: Mapped["SpeechEvaluation"] = relationship("SpeechEvaluation", back_populates="session", uselist=False, cascade="all, delete-orphan")  # noqa: F821
