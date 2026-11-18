from types import SimpleNamespace
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from services.transcription import transcription_service
from services.evaluation import evaluation_service


@pytest.mark.asyncio
async def test_transcription_deepgram_sdk_mock():
    mock_channel = MagicMock()
    mock_alt = MagicMock()
    mock_alt.transcript = "Hello world um actually"
    mock_word1 = SimpleNamespace(word="Hello", start=0.0, end=0.5, punctuated_word="Hello,")
    mock_word2 = SimpleNamespace(word="world", start=0.6, end=1.0, punctuated_word="world")
    mock_word3 = SimpleNamespace(word="um", start=1.1, end=1.3, punctuated_word="um")
    mock_word4 = SimpleNamespace(word="actually", start=1.4, end=1.8, punctuated_word="actually")
    mock_alt.words = [mock_word1, mock_word2, mock_word3, mock_word4]
    mock_channel.alternatives = [mock_alt]

    mock_resp = MagicMock()
    mock_resp.results.channels = [mock_channel]

    with patch("services.transcription.AsyncDeepgramClient") as mock_dg_cls, \
         patch("builtins.open", MagicMock()):
        mock_client = MagicMock()
        mock_client.listen.v1.media.transcribe_file = AsyncMock(return_value=mock_resp)
        mock_dg_cls.return_value = mock_client
        with patch("services.transcription.settings.DEEPGRAM_API_KEY", "fake_key"):
            res = await transcription_service._call_deepgram("dummy.m4a")
            assert res is not None
            assert res["transcript"] == "Hello world um actually"
            assert res["filler_words_count"] == 2
            assert res["word_timings"][0]["punctuated_word"] == "Hello,"


@pytest.mark.asyncio
async def test_evaluation_openai_responses_sdk_mock():
    mock_openai_resp = MagicMock()
    mock_openai_resp.output_text = '{"overall_score": 92, "clarity_score": 90}'

    with patch("services.evaluation.AsyncOpenAI") as mock_oai_cls:
        mock_oai_client = MagicMock()
        mock_oai_client.responses.create = AsyncMock(return_value=mock_openai_resp)
        mock_oai_cls.return_value = mock_oai_client
        with patch("services.evaluation.settings.OPENAI_API_KEY", "fake_key"):
            eval_res = await evaluation_service._call_openai(
                topic_title="Test",
                topic_prompt="Test prompt",
                topic_category="Category",
                transcript="Hello world",
                acoustic_metrics={"duration_seconds": 10},
                transcription_metrics={"speaking_rate_wpm": 140},
            )
            assert eval_res is not None
            assert eval_res["overall_score"] == 92
            # Verify called model
            args, kwargs = mock_oai_client.responses.create.call_args
            assert kwargs["model"] == "gpt-6-luna"
            assert kwargs["text"] == {"format": {"type": "json_object"}}
            assert "Clario's Master Articulation" in kwargs["instructions"]
            assert "Topic: Test (Category)" in kwargs["input"]
