from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base, TimestampMixin


class Topic(Base, TimestampMixin):
    __tablename__ = "topics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[str] = mapped_column(String(32), default="Intermediate", index=True)
    prep_time_seconds: Mapped[int] = mapped_column(Integer, default=30)
    speaking_time_seconds: Mapped[int] = mapped_column(Integer, default=120)
    suggested_framework: Mapped[str | None] = mapped_column(String(128), default="PREP Framework")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    sessions: Mapped[list["PracticeSession"]] = relationship("PracticeSession", back_populates="topic")  # noqa: F821
