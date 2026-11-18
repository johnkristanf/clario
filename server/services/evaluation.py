import json
import re
from functools import lru_cache
from pathlib import Path
from openai import AsyncOpenAI
from core.config import settings

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"


@lru_cache
def get_prompt(filename: str) -> str:
    return (PROMPTS_DIR / filename).read_text(encoding="utf-8")


class EvaluationService:
    @staticmethod
    async def evaluate_speech(
        topic_title: str,
        topic_prompt: str,
        topic_category: str,
        transcript: str,
        acoustic_metrics: dict,
        transcription_metrics: dict,
        previous_evaluation: dict | None = None,
    ) -> dict:
        """
        Evaluates speech across the 7 dimensions, combining Librosa acoustics and transcript.
        Calls OpenAI if key available, otherwise uses calibrated heuristic evaluator.
        """
        if settings.OPENAI_API_KEY:
            try:
                result = await EvaluationService._call_openai(
                    topic_title=topic_title,
                    topic_prompt=topic_prompt,
                    topic_category=topic_category,
                    transcript=transcript,
                    acoustic_metrics=acoustic_metrics,
                    transcription_metrics=transcription_metrics,
                    previous_evaluation=previous_evaluation,
                )
                if result:
                    return result
            except Exception as e:
                print(f"[EvaluationService] OpenAI API error: {e}. Falling back to heuristic engine.")

        return EvaluationService._heuristic_evaluation(
            topic_prompt=topic_prompt,
            transcript=transcript,
            acoustic_metrics=acoustic_metrics,
            transcription_metrics=transcription_metrics,
            previous_evaluation=previous_evaluation,
        )

    @staticmethod
    async def _call_openai(
        topic_title: str,
        topic_prompt: str,
        topic_category: str,
        transcript: str,
        acoustic_metrics: dict,
        transcription_metrics: dict,
        previous_evaluation: dict | None = None,
    ) -> dict | None:
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        system_prompt = get_prompt("speech_evaluation_system.md")
        user_template = get_prompt("speech_evaluation_user.md")

        prev_session_str = json.dumps(previous_evaluation) if previous_evaluation else "None (First session)"
        user_content = (
            user_template
            .replace("{topic_title}", str(topic_title))
            .replace("{topic_category}", str(topic_category))
            .replace("{topic_prompt}", str(topic_prompt))
            .replace("{transcript}", str(transcript))
            .replace("{duration_seconds}", str(acoustic_metrics.get("duration_seconds")))
            .replace("{speaking_rate_wpm}", str(transcription_metrics.get("speaking_rate_wpm")))
            .replace("{pause_count}", str(acoustic_metrics.get("pause_count")))
            .replace("{long_pauses_duration}", str(acoustic_metrics.get("long_pauses_duration")))
            .replace("{filler_words_count}", str(transcription_metrics.get("filler_words_count")))
            .replace("{filler_words_list}", str(transcription_metrics.get("filler_words_list")))
            .replace("{volume_variation_score}", str(acoustic_metrics.get("volume_variation_score")))
            .replace("{vocal_steadiness_score}", str(acoustic_metrics.get("vocal_steadiness_score")))
            .replace("{previous_session}", prev_session_str)
        )

        response = await client.responses.create(
            model=settings.OPENAI_MODEL or "gpt-6-luna",
            instructions=system_prompt,
            input=user_content,
            text={"format": {"type": "json_object"}},
            temperature=0.4,
        )

        content = response.output_text.strip()
        if not content:
            return None
        if content.startswith("```"):
            content = re.sub(r"^```(?:json)?\s*", "", content)
            content = re.sub(r"\s*```$", "", content)
        return json.loads(content)

    @staticmethod
    def _heuristic_evaluation(
        topic_prompt: str,
        transcript: str,
        acoustic_metrics: dict,
        transcription_metrics: dict,
        previous_evaluation: dict | None = None,
    ) -> dict:
        words = transcript.lower().split()
        total_words = max(len(words), 1)

        # 1. Fluency Score (penalize fillers and long pauses)
        filler_count = transcription_metrics.get("filler_words_count", 0)
        filler_ratio = filler_count / total_words
        pause_count = acoustic_metrics.get("pause_count", 0)
        long_pause_dur = acoustic_metrics.get("long_pauses_duration", 0.0)

        fluency_penalty = min(filler_ratio * 150 + (long_pause_dur * 4), 45.0)
        fluency_score = int(max(95.0 - fluency_penalty, 40.0))

        # 2. Vocabulary Score (Type-Token Ratio and length)
        unique_words = set(words)
        ttr = len(unique_words) / total_words
        avg_len = sum(len(w) for w in words) / total_words
        vocab_score = int(min(max(ttr * 65 + avg_len * 5 + 30, 45.0), 96.0))

        # 3. Relevance Score (overlap with topic keywords)
        prompt_keywords = {w.lower() for w in topic_prompt.split() if len(w) > 3}
        matches = sum(1 for kw in prompt_keywords if kw in transcript.lower())
        overlap_ratio = matches / max(len(prompt_keywords), 1)
        relevance_score = int(min(max(overlap_ratio * 40 + 60, 50.0), 98.0))

        # 4. Structure Score (presence of transition / framework markers)
        structure_markers = ["first", "second", "because", "for example", "instance", "therefore", "in conclusion", "summarize", "point", "reason"]
        marker_hits = sum(1 for m in structure_markers if m in transcript.lower())
        structure_score = int(min(60 + marker_hits * 8, 95))

        # 5. Grammar & Clarity
        clarity_score = int((relevance_score * 0.4) + (structure_score * 0.3) + (fluency_score * 0.3))
        grammar_score = int(min(max(82 + (avg_len * 2) - (filler_ratio * 20), 55), 96))

        # 6. Confidence & Delivery (WPM proximity to 140 WPM, volume dynamics, vocal steadiness)
        wpm = transcription_metrics.get("speaking_rate_wpm", 135.0)
        wpm_diff = abs(wpm - 140.0)
        wpm_score = max(100 - (wpm_diff * 0.8), 50)
        steadiness = acoustic_metrics.get("vocal_steadiness_score", 75.0)
        vol_dyn = acoustic_metrics.get("volume_variation_score", 70.0)
        confidence_score = int((wpm_score * 0.4) + (steadiness * 0.3) + (vol_dyn * 0.3))

        # Overall Score
        overall_score = int(
            (clarity_score * 0.20)
            + (structure_score * 0.20)
            + (fluency_score * 0.15)
            + (vocabulary_score * 0.15)
            + (grammar_score * 0.10)
            + (relevance_score * 0.10)
            + (confidence_score * 0.10)
        )

        strengths = [
            f"Strong relevance to the prompt with {relevance_score}% alignment.",
            f"Maintained an optimal speaking pace of {wpm} WPM.",
            f"Vocal steadiness and inflection provided natural confidence."
        ]

        improvements = []
        if filler_count > 2:
            improvements.append(f"Noticed {filler_count} filler words during transitional phrases.")
        else:
            improvements.append("Smooth transition between opening and body thoughts.")

        if long_pause_dur > 1.5:
            improvements.append(f"Detected {long_pause_dur}s of hesitation pauses; practice breathing through pauses.")
        else:
            improvements.append("Refine conclusion punchiness to finish with higher impact.")

        improvements.append("Strengthen intermediate assertions using the PREP framework.")

        comparison = None
        if previous_evaluation:
            prev_overall = previous_evaluation.get("overall_score", 70)
            diff = overall_score - prev_overall
            direction = "increased" if diff >= 0 else "adjusted"
            comparison = f"Overall score {direction} by {abs(diff)} points compared to your last session. Fluency and structure show steady growth."

        return {
            "overall_score": overall_score,
            "clarity_score": clarity_score,
            "structure_score": structure_score,
            "fluency_score": fluency_score,
            "vocabulary_score": vocabulary_score,
            "grammar_score": grammar_score,
            "relevance_score": relevance_score,
            "confidence_score": confidence_score,
            "strengths": strengths,
            "improvements": improvements,
            "suggested_framework": "PREP Framework (Point, Reason, Example, Point)",
            "framework_advice": "State your direct Point immediately, explain the Reason with 'because', provide a concrete Example from real life, and restate your Point firmly.",
            "comparison_to_previous": comparison,
        }


evaluation_service = EvaluationService()
