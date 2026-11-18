from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from db.session import get_db
from models.session import PracticeSession
from models.evaluation import SpeechEvaluation
from schemas.evaluation import EvaluationJobStatus, SpeechEvaluationResponse
from services.pipeline import JOB_PROGRESS

router = APIRouter(prefix="/evaluations", tags=["evaluations"])


@router.get("/status/{session_id}", response_model=EvaluationJobStatus)
def get_evaluation_status(session_id: str, db: Session = Depends(get_db)):
    session = db.get(PracticeSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    job_info = JOB_PROGRESS.get(session_id, {})
    stage = job_info.get("stage")
    progress = job_info.get("progress", 0)

    eval_data = None
    if session.status == "completed":
        evaluation = db.scalar(
            select(SpeechEvaluation).where(SpeechEvaluation.session_id == session_id)
        )
        if evaluation:
            eval_data = SpeechEvaluationResponse.model_validate(evaluation)
            stage = "done"
            progress = 100
    elif session.status == "failed":
        stage = "failed"
        progress = 0

    return EvaluationJobStatus(
        session_id=session_id,
        status=session.status,
        stage=stage,
        progress=progress,
        error_message=session.error_message,
        evaluation=eval_data,
    )


@router.get("/{session_id}", response_model=SpeechEvaluationResponse)
def get_evaluation_by_session_id(session_id: str, db: Session = Depends(get_db)):
    evaluation = db.scalar(
        select(SpeechEvaluation).where(SpeechEvaluation.session_id == session_id)
    )
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found for this session")
    return evaluation
