import random
from sqlalchemy.orm import Session
from sqlalchemy import select, func, not_
from core.config import settings
from models.topic import Topic
from models.session import PracticeSession
from models.evaluation import SpeechEvaluation

CURATED_TOPICS = [
    # Self-expression
    {
        "category": "Self-expression",
        "title": "Recent Learning",
        "prompt": "Describe something you have learned recently and how it changed your perspective.",
        "difficulty": "Beginner",
        "prep_time_seconds": 30,
        "speaking_time_seconds": 120,
        "suggested_framework": "PREP Framework (Point, Reason, Example, Point)",
    },
    {
        "category": "Self-expression",
        "title": "Defining Moment",
        "prompt": "Reflect on a book, movie, or conversation that reshaped one of your core beliefs.",
        "difficulty": "Intermediate",
        "prep_time_seconds": 30,
        "speaking_time_seconds": 120,
        "suggested_framework": "STAR Method (Situation, Task, Action, Result)",
    },
    {
        "category": "Self-expression",
        "title": "Personal Creed",
        "prompt": "If you had to distill your personal philosophy on work and life into three rules, what are they?",
        "difficulty": "Advanced",
        "prep_time_seconds": 30,
        "speaking_time_seconds": 120,
        "suggested_framework": "Rule of Three (Introduction, 3 Pillars, Synthesis)",
    },

    # Critical thinking
    {
        "category": "Critical thinking",
        "title": "AI and Creativity",
        "prompt": "Is artificial intelligence making people less creative or expanding human capability?",
        "difficulty": "Intermediate",
        "prep_time_seconds": 30,
        "speaking_time_seconds": 120,
        "suggested_framework": "Dialectical Method (Thesis, Antithesis, Synthesis)",
    },
    {
        "category": "Critical thinking",
        "title": "Information Overload",
        "prompt": "Are modern notification streams degrading deep critical thinking across society?",
        "difficulty": "Beginner",
        "prep_time_seconds": 30,
        "speaking_time_seconds": 120,
        "suggested_framework": "PREP Framework (Point, Reason, Example, Point)",
    },
    {
        "category": "Critical thinking",
        "title": "Algorithmic Decision-Making",
        "prompt": "Should algorithms be permitted to make life-altering decisions in medicine or judicial bail?",
        "difficulty": "Advanced",
        "prep_time_seconds": 30,
        "speaking_time_seconds": 120,
        "suggested_framework": "Toulmin Argument Model (Claim, Grounds, Warrant, Rebuttal)",
    },

    # Problem-solving
    {
        "category": "Problem-solving",
        "title": "Public Transportation",
        "prompt": "How would you improve public transportation and reduce congestion in your city?",
        "difficulty": "Beginner",
        "prep_time_seconds": 30,
        "speaking_time_seconds": 120,
        "suggested_framework": "Problem-Solution-Impact Framework",
    },
    {
        "category": "Problem-solving",
        "title": "Affordable Housing",
        "prompt": "Propose a sustainable strategy to address urban housing affordability without stifling growth.",
        "difficulty": "Advanced",
        "prep_time_seconds": 30,
        "speaking_time_seconds": 120,
        "suggested_framework": "Stakeholder Tradeoff Analysis",
    },

    # Storytelling
    {
        "category": "Storytelling",
        "title": "A Difficult Decision",
        "prompt": "Tell me about a difficult decision you had to make and what you learned from the outcome.",
        "difficulty": "Beginner",
        "prep_time_seconds": 30,
        "speaking_time_seconds": 120,
        "suggested_framework": "STAR Method (Situation, Task, Action, Result)",
    },
    {
        "category": "Storytelling",
        "title": "The Overcoming Narrative",
        "prompt": "Recount an unexpected failure that later turned out to be a valuable turning point.",
        "difficulty": "Intermediate",
        "prep_time_seconds": 30,
        "speaking_time_seconds": 120,
        "suggested_framework": "Hero's Journey in Miniature (Conflict, Pivot, Resolution)",
    },

    # Professional communication
    {
        "category": "Professional communication",
        "title": "Demystifying Tech",
        "prompt": "Explain a complex technical concept (like cloud computing or APIs) to a non-technical person.",
        "difficulty": "Beginner",
        "prep_time_seconds": 30,
        "speaking_time_seconds": 120,
        "suggested_framework": "Analogy Bridge (Familiar Concept -> Bridge -> New Concept)",
    },
    {
        "category": "Professional communication",
        "title": "Executive Pitch",
        "prompt": "Convince your company leadership to invest in modernizing internal communication tools.",
        "difficulty": "Advanced",
        "prep_time_seconds": 30,
        "speaking_time_seconds": 120,
        "suggested_framework": "Minto Pyramid Principle (Core Recommendation -> 3 Reasons -> Evidence)",
    },

    # Argumentation
    {
        "category": "Argumentation",
        "title": "Skills vs Degrees",
        "prompt": "Should modern companies prioritize proven practical skills over formal academic degrees?",
        "difficulty": "Intermediate",
        "prep_time_seconds": 30,
        "speaking_time_seconds": 120,
        "suggested_framework": "PREP Framework (Point, Reason, Example, Point)",
    },
    {
        "category": "Argumentation",
        "title": "Remote vs In-Office Work",
        "prompt": "Argue whether full remote flexibility or mandatory in-office presence yields greater long-term innovation.",
        "difficulty": "Intermediate",
        "prep_time_seconds": 30,
        "speaking_time_seconds": 120,
        "suggested_framework": "Comparative Advantage Framework",
    },

    # General knowledge
    {
        "category": "General knowledge",
        "title": "Qualities of Leadership",
        "prompt": "What truly makes a good leader during times of crisis and uncertainty?",
        "difficulty": "Beginner",
        "prep_time_seconds": 30,
        "speaking_time_seconds": 120,
        "suggested_framework": "Rule of Three (Vision, Empathy, Decisiveness)",
    },
    {
        "category": "General knowledge",
        "title": "The Future of Education",
        "prompt": "What fundamental change will higher education undergo over the next two decades?",
        "difficulty": "Intermediate",
        "prep_time_seconds": 30,
        "speaking_time_seconds": 120,
        "suggested_framework": "Trend Extrapolation & Synthesis",
    },

    # Spontaneous thinking
    {
        "category": "Spontaneous thinking",
        "title": "Changing Society",
        "prompt": "If you could change one fundamental norm in modern society overnight, what would it be and why?",
        "difficulty": "Beginner",
        "prep_time_seconds": 30,
        "speaking_time_seconds": 120,
        "suggested_framework": "What If -> Why -> Ripple Effect",
    },
    {
        "category": "Spontaneous thinking",
        "title": "The Time Capsule",
        "prompt": "You are burying an artifact that represents the year 2026 for archaeologists in 3026. What is it?",
        "difficulty": "Intermediate",
        "prep_time_seconds": 30,
        "speaking_time_seconds": 120,
        "suggested_framework": "Symbolic Resonance -> Justification -> Legacy",
    },
]


class TopicService:
    @staticmethod
    def seed_initial_topics(db: Session):
        """Seeds curated topics if table is empty."""
        count = db.scalar(select(func.count(Topic.id)))
        if count == 0:
            for item in CURATED_TOPICS:
                topic = Topic(**item)
                db.add(topic)
            db.commit()

    @staticmethod
    def get_daily_topic(user_id: str | None, db: Session, difficulty: str | None = None) -> Topic:
        """
        Gets a daily topic avoiding repetitive prompts from user's recent history.
        """
        TopicService.seed_initial_topics(db)

        # Find recent topic IDs practiced by user in past 10 sessions
        recent_topic_ids = []
        if user_id:
            recent_sessions = db.scalars(
                select(PracticeSession.topic_id)
                .where(PracticeSession.user_id == user_id, PracticeSession.topic_id.is_not(None))
                .order_by(PracticeSession.created_at.desc())
                .limit(10)
            ).all()
            recent_topic_ids = [tid for tid in recent_sessions if tid]

        query = select(Topic).where(Topic.is_active == True)
        if difficulty:
            query = query.where(Topic.difficulty == difficulty)

        # Exclude recent topic IDs if candidates remain
        if recent_topic_ids:
            fresh_query = query.where(not_(Topic.id.in_(recent_topic_ids)))
            fresh_topics = db.scalars(fresh_query).all()
            if fresh_topics:
                return random.choice(fresh_topics)

        # Fallback to any active topic
        all_topics = db.scalars(query).all()
        if all_topics:
            return random.choice(all_topics)

        # Create one if somehow none exists
        default = Topic(**CURATED_TOPICS[0])
        db.add(default)
        db.commit()
        db.refresh(default)
        return default

    @staticmethod
    def get_weakness_based_topic(user_id: str, db: Session) -> Topic:
        """
        Finds user's weakest articulation dimension and picks a tailored topic.
        """
        TopicService.seed_initial_topics(db)

        # Query user's past evaluations
        evaluations = db.scalars(
            select(SpeechEvaluation)
            .join(PracticeSession, SpeechEvaluation.session_id == PracticeSession.id)
            .where(PracticeSession.user_id == user_id)
            .order_by(SpeechEvaluation.created_at.desc())
            .limit(10)
        ).all()

        target_category = "Critical thinking"
        if evaluations:
            # Average scores across dimensions
            dim_sums = {
                "clarity": sum(e.clarity_score for e in evaluations) / len(evaluations),
                "structure": sum(e.structure_score for e in evaluations) / len(evaluations),
                "fluency": sum(e.fluency_score for e in evaluations) / len(evaluations),
                "vocabulary": sum(e.vocabulary_score for e in evaluations) / len(evaluations),
                "grammar": sum(e.grammar_score for e in evaluations) / len(evaluations),
                "relevance": sum(e.relevance_score for e in evaluations) / len(evaluations),
                "confidence": sum(e.confidence_score for e in evaluations) / len(evaluations),
            }
            weakest_dim = min(dim_sums, key=dim_sums.get)

            # Map weakness to category
            category_mapping = {
                "structure": "Argumentation",
                "fluency": "Spontaneous thinking",
                "clarity": "Professional communication",
                "vocabulary": "Critical thinking",
                "grammar": "Self-expression",
                "relevance": "Problem-solving",
                "confidence": "Storytelling",
            }
            target_category = category_mapping.get(weakest_dim, "Argumentation")

        # Select topic from that category
        topics = db.scalars(select(Topic).where(Topic.category == target_category, Topic.is_active == True)).all()
        if topics:
            return random.choice(topics)

        return TopicService.get_daily_topic(user_id, db)


topic_service = TopicService()
