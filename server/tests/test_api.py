import io
import pytest
from fastapi.testclient import TestClient
from main import app


def test_root():
    with TestClient(app) as client:
        response = client.get("/")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


def test_get_daily_topic():
    with TestClient(app) as client:
        response = client.get("/api/v1/topics/daily")
        assert response.status_code == 200
        data = response.json()
        assert "prompt" in data
        assert "category" in data
        assert "difficulty" in data


def test_get_categories():
    with TestClient(app) as client:
        response = client.get("/api/v1/topics/categories")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 8


def test_upload_and_evaluate_flow():
    import numpy as np
    import soundfile as sf

    sr = 16000
    t = np.linspace(0, 2.0, int(sr * 2.0), endpoint=False)
    audio_data = 0.5 * np.sin(2 * np.pi * 440 * t)
    bio = io.BytesIO()
    sf.write(bio, audio_data, sr, format="WAV")
    bio.seek(0)

    with TestClient(app) as client:
        files = {"audio": ("test_speech.wav", bio, "audio/wav")}
        data = {"user_id": "test_user_1", "topic_id": "1"}
        response = client.post("/api/v1/sessions/upload", files=files, data=data)
        assert response.status_code == 200
        res_data = response.json()
        session_id = res_data["session_id"]
        assert res_data["status"] == "processing"

        # Poll status
        status_resp = client.get(f"/api/v1/evaluations/status/{session_id}")
        assert status_resp.status_code == 200
        status_data = status_resp.json()
        assert status_data["session_id"] == session_id

        # Check user history endpoint
        hist_resp = client.get("/api/v1/sessions/user/test_user_1/history")
        assert hist_resp.status_code == 200
        hist_data = hist_resp.json()
        assert hist_data["user_id"] == "test_user_1"
