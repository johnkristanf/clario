from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select

from db.session import get_db
from models.topic import Topic
from schemas.topic import TopicResponse
from services.topic import topic_service

router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("/daily", response_model=TopicResponse)
def get_daily_topic(
    user_id: str | None = Query(None, description="Optional user ID to avoid recent topics"),
    difficulty: str | None = Query(None, description="Beginner | Intermediate | Advanced"),
    db: Session = Depends(get_db),
):
    topic = topic_service.get_daily_topic(user_id=user_id, db=db, difficulty=difficulty)
    return topic


@router.get("/weakness-focused", response_model=TopicResponse)
def get_weakness_focused_topic(
    user_id: str = Query(..., description="User ID to evaluate weaknesses"),
    db: Session = Depends(get_db),
):
    topic = topic_service.get_weakness_based_topic(user_id=user_id, db=db)
    return topic


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    topic_service.seed_initial_topics(db)
    categories = [
        {"name": "Self-expression", "description": "Articulate personal growth, values, and core philosophies."},
        {"name": "Critical thinking", "description": "Analyze arguments, identify nuances, and think deeply."},
        {"name": "Problem-solving", "description": "Structure solutions, evaluate trade-offs, and address complexity."},
        {"name": "Storytelling", "description": "Engage listeners through narrative arcs and pivotal lessons."},
        {"name": "Professional communication", "description": "Explain technical topics clearly and persuade stakeholders."},
        {"name": "Argumentation", "description": "Defend positions with evidence and structured counter-arguments."},
        {"name": "General knowledge", "description": "Synthesize societal principles, history, and broad concepts."},
        {"name": "Spontaneous thinking", "description": "Think fast on your feet when confronted with novel prompts."},
    ]
    return categories


@router.get("/{topic_id}", response_model=TopicResponse)
def get_topic_by_id(topic_id: int, db: Session = Depends(get_db)):
    topic = db.get(Topic, topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic
