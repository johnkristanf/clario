import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from db.session import get_db
from models.user import User
from models.topic import Topic
from models.session import PracticeSession
from models.evaluation import SpeechEvaluation
from schemas.session import PracticeSessionResponse, UserHistoryResponse, UserProgressionDimension
from services.storage import storage_service
from services.pipeline import pipeline_service

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("/upload")
async def upload_speech_session(
    background_tasks: BackgroundTasks,
    audio: UploadFile = File(...),
    user_id: str = Form(...),
    topic_id: int | None = Form(None),
    db: Session = Depends(get_db),
):
    # Ensure user exists or create guest record
    user = db.get(User, user_id)
    if not user:
        user = User(id=user_id, full_name="Clario Speaker")
        db.add(user)
        db.commit()

    # Read uploaded audio content
    content = await audio.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file uploaded")

    # Save audio file
    filename = audio.filename or "recording.m4a"
    audio_url, local_path = await storage_service.save_audio_file(content, filename)

    session_id = str(uuid.uuid4())
    practice_session = PracticeSession(
        id=session_id,
        user_id=user_id,
        topic_id=topic_id,
        audio_url=audio_url,
        duration_seconds=0.0,
        status="processing",
    )
    db.add(practice_session)
    db.commit()

    # Trigger background evaluation pipeline
    background_tasks.add_task(
        pipeline_service.run_evaluation_pipeline,
        session_id=session_id,
        local_audio_path=local_path,
        topic_id=topic_id,
    )

    return {
        "session_id": session_id,
        "status": "processing",
        "audio_url": audio_url,
        "message": "Audio uploaded successfully. Processing evaluation.",
    }


@router.get("/{session_id}", response_model=PracticeSessionResponse)
def get_session_details(session_id: str, db: Session = Depends(get_db)):
    session = db.get(PracticeSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Practice session not found")
    return session


@router.get("/user/{user_id}/history", response_model=UserHistoryResponse)
def get_user_history(user_id: str, db: Session = Depends(get_db)):
    sessions = db.scalars(
        select(PracticeSession)
        .where(PracticeSession.user_id == user_id)
        .order_by(desc(PracticeSession.created_at))
    ).all()

    total_sessions = len(sessions)
    if total_sessions == 0:
        return UserHistoryResponse(
            user_id=user_id,
            total_sessions=0,
            streak_days=0,
            dimension_progression=[],
            persistent_weaknesses=["Complete your first speaking session to uncover your communication patterns."],
            recent_sessions=[],
        )

    # 1. Calculate streak (consecutive days)
    session_dates = sorted({s.created_at.date() for s in sessions}, reverse=True)
    today = datetime.now(timezone.utc).date()
    streak = 0
    check_date = today

    for d in session_dates:
        if d == check_date or d == check_date - timedelta(days=1):
            streak += 1
            check_date = d
        else:
            break

    # 2. Extract evaluations to compute progression across 7 dimensions
    evaluations = [s.evaluation for s in reversed(sessions) if s.evaluation is not None]

    dimensions = ["Clarity", "Structure", "Fluency", "Vocabulary", "Grammar", "Relevance", "Confidence"]
    dim_field_map = {
        "Clarity": "clarity_score",
        "Structure": "structure_score",
        "Fluency": "fluency_score",
        "Vocabulary": "vocabulary_score",
        "Grammar": "grammar_score",
        "Relevance": "relevance_score",
        "Confidence": "confidence_score",
    }

    dimension_progression = []
    persistent_weaknesses = []

    if evaluations:
        first_quarter = evaluations[: max(len(evaluations) // 3, 1)]
        recent_quarter = evaluations[-max(len(evaluations) // 3, 1):]

        for dim in dimensions:
            field = dim_field_map[dim]
            init_avg = round(sum(getattr(e, field) for e in first_quarter) / len(first_quarter), 1)
            curr_avg = round(sum(getattr(e, field) for e in recent_quarter) / len(recent_quarter), 1)
            diff = round(curr_avg - init_avg, 1)

            dimension_progression.append(
                UserProgressionDimension(
                    dimension=dim,
                    initial_average=init_avg,
                    current_average=curr_avg,
                    change=diff,
                )
            )

        # Identify persistent weaknesses
        lowest_dim = min(dimension_progression, key=lambda d: d.current_average)
        if lowest_dim.current_average < 75:
            persistent_weaknesses.append(f"Struggles with {lowest_dim.dimension.lower()} (Current avg: {lowest_dim.current_average}%).")

        # Check filler words count across sessions
        avg_fillers = sum(e.filler_words_count for e in evaluations) / len(evaluations)
        if avg_fillers > 4:
            persistent_weaknesses.append(f"Frequent filler words (averaging {round(avg_fillers, 1)} per session).")

        # Check long pauses
        avg_pauses = sum(e.long_pauses_duration for e in evaluations) / len(evaluations)
        if avg_pauses > 3.0:
            persistent_weaknesses.append(f"Hesitations and long pauses (averaging {round(avg_pauses, 1)}s of pause per session).")

        if not persistent_weaknesses:
            persistent_weaknesses.append("Strong balanced delivery across all communication dimensions.")

    return UserHistoryResponse(
        user_id=user_id,
        total_sessions=total_sessions,
        streak_days=max(streak, 1) if sessions else 0,
        dimension_progression=dimension_progression,
        persistent_weaknesses=persistent_weaknesses,
        recent_sessions=sessions[:15],
    )
