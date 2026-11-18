import asyncio
import traceback
from sqlalchemy.orm import Session
from sqlalchemy import select

from db.session import SessionLocal
from models.session import PracticeSession
from models.topic import Topic
from models.evaluation import SpeechEvaluation
from services.acoustic import acoustic_service
from services.transcription import transcription_service
from services.evaluation import evaluation_service

# In-memory progress tracking for quick UI feedback during async polling
JOB_PROGRESS: dict[str, dict] = {}


class PipelineService:
    @staticmethod
    async def run_evaluation_pipeline(session_id: str, local_audio_path: str, topic_id: int | None):
        JOB_PROGRESS[session_id] = {
            "stage": "analyzing_acoustics",
            "progress": 25,
            "message": "Analyzing vocal acoustics and speaking pace with Librosa...",
        }

        db: Session = SessionLocal()
        try:
            # 1. Fetch session and topic
            session = db.get(PracticeSession, session_id)
            if not session:
                return

            topic = db.get(Topic, topic_id) if topic_id else None
            topic_title = topic.title if topic else "General Articulation Practice"
            topic_prompt = topic.prompt if topic else "Speak on a chosen topic."
            topic_category = topic.category if topic else "Spontaneous thinking"

            # 2. Librosa acoustic analysis
            acoustic_data = acoustic_service.analyze_audio(local_audio_path)
            duration = acoustic_data.get("duration_seconds", 30.0)
            session.duration_seconds = duration
            db.commit()

            JOB_PROGRESS[session_id] = {
                "stage": "transcribing",
                "progress": 55,
                "message": "Transcribing speech and detecting filler words with Deepgram...",
            }

            # 3. Deepgram transcription & word timing analysis
            transcription_data = await transcription_service.transcribe(
                audio_path=local_audio_path,
                duration_seconds=duration,
                topic_prompt=topic_prompt,
            )

            JOB_PROGRESS[session_id] = {
                "stage": "evaluating",
                "progress": 80,
                "message": "Evaluating 7 dimensions and structuring recommendations with AI...",
            }

            # 4. Fetch previous evaluation for longitudinal progress comparison
            previous_eval = db.scalar(
                select(SpeechEvaluation)
                .join(PracticeSession, SpeechEvaluation.session_id == PracticeSession.id)
                .where(PracticeSession.user_id == session.user_id, PracticeSession.id != session_id)
                .order_by(SpeechEvaluation.created_at.desc())
                .limit(1)
            )
            prev_eval_dict = None
            if previous_eval:
                prev_eval_dict = {
                    "overall_score": previous_eval.overall_score,
                    "clarity_score": previous_eval.clarity_score,
                    "structure_score": previous_eval.structure_score,
                    "fluency_score": previous_eval.fluency_score,
                }

            # 5. OpenAI / heuristic evaluation
            evaluation_result = await evaluation_service.evaluate_speech(
                topic_title=topic_title,
                topic_prompt=topic_prompt,
                topic_category=topic_category,
                transcript=transcription_data.get("transcript", ""),
                acoustic_metrics=acoustic_data,
                transcription_metrics=transcription_data,
                previous_evaluation=prev_eval_dict,
            )

            # 6. Persist SpeechEvaluation
            speech_eval = SpeechEvaluation(
                session_id=session_id,
                overall_score=evaluation_result.get("overall_score", 75),
                clarity_score=evaluation_result.get("clarity_score", 75),
                structure_score=evaluation_result.get("structure_score", 75),
                fluency_score=evaluation_result.get("fluency_score", 75),
                vocabulary_score=evaluation_result.get("vocabulary_score", 75),
                grammar_score=evaluation_result.get("grammar_score", 75),
                relevance_score=evaluation_result.get("relevance_score", 75),
                confidence_score=evaluation_result.get("confidence_score", 75),
                # Acoustics
                speaking_rate_wpm=transcription_data.get("speaking_rate_wpm", 135.0),
                pause_count=acoustic_data.get("pause_count", 0),
                long_pauses_duration=acoustic_data.get("long_pauses_duration", 0.0),
                filler_words_count=transcription_data.get("filler_words_count", 0),
                filler_words_list=transcription_data.get("filler_words_list", []),
                vocal_steadiness_score=acoustic_data.get("vocal_steadiness_score", 75.0),
                volume_variation_score=acoustic_data.get("volume_variation_score", 70.0),
                # Transcript & Timings
                transcript=transcription_data.get("transcript", ""),
                word_timings=transcription_data.get("word_timings", []),
                pauses=acoustic_data.get("pauses", []),
                # AI Guidance
                strengths=evaluation_result.get("strengths", []),
                improvements=evaluation_result.get("improvements", []),
                suggested_framework=evaluation_result.get("suggested_framework", "PREP Framework"),
                framework_advice=evaluation_result.get("framework_advice", ""),
                comparison_to_previous=evaluation_result.get("comparison_to_previous"),
            )

            db.add(speech_eval)
            session.status = "completed"
            db.commit()

            JOB_PROGRESS[session_id] = {
                "stage": "done",
                "progress": 100,
                "message": "Evaluation completed!",
            }
        except Exception as e:
            traceback.print_exc()
            JOB_PROGRESS[session_id] = {
                "stage": "failed",
                "progress": 0,
                "message": f"Evaluation failed: {e}",
            }
            if session:
                session.status = "failed"
                session.error_message = str(e)
                db.commit()
        finally:
            db.close()


pipeline_service = PipelineService()
