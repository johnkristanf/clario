# Clario Server — Agent Guide

> Python 3.12 · FastAPI · SQLAlchemy · Alembic · Supabase · Deepgram · OpenAI
> Read the root `AGENTS.md` first for monorepo architecture and shared conventions.

---

## Package Manager

**Always use `uv`. Never call `pip` directly.**

```bash
uv add <package>          # add a dependency
uv add --dev <package>    # add a dev dependency
uv remove <package>       # remove a dependency
uv run <command>          # run any command inside the venv
uv sync                   # sync venv to lock file
```

---

## Commands

```bash
# Start dev server
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Database migrations
uv run alembic revision --autogenerate -m "describe change"
uv run alembic upgrade head
uv run alembic downgrade -1

# Run tests (REQUIRED before declaring any task done)
uv run pytest
uv run pytest server/tests/test_api.py -v
uv run pytest server/tests/test_sdk_services.py -v
```

---

---

## Evaluation Pipeline

The core business logic lives in `services/pipeline.py`. It runs three stages **in sequence**:

1. **Librosa acoustic analysis** (`services/acoustic.py`) — extracts pause count, duration, speaking rate, vocal steadiness, volume variation
2. **Deepgram Nova-3 transcription** (`services/transcription.py`) — REST batch transcription, word timings, filler word detection
3. **OpenAI GPT evaluation** (`services/evaluation.py`) — scores 7 dimensions, generates strengths/improvements, coaching advice, comparison to previous session

Progress is tracked in the in-memory `JOB_PROGRESS` dict (keyed by `session_id`) and polled by the mobile client.

> [!IMPORTANT]
> When the `DEEPGRAM_API_KEY` or `OPENAI_API_KEY` env vars are absent, services fall back to local simulation. Tests must pass in both modes.

---

## Database

- **ORM:** SQLAlchemy 2.0 (sync engine with PgBouncer-compatible pool settings)
- **Migrations:** Alembic (`alembic/versions/`)
- **Schema reference:** `SCHEMA.md` — always update it when changing models

### Rules
- Never edit existing migration files — always generate new ones
- Run `uv run alembic upgrade head` locally before testing migration changes
- Use `prepare_threshold=0` on the engine (already set) — required for Supabase PgBouncer transaction mode
- Read the `supabase-postgres-best-practices` skill before writing queries, indexes, or RLS policies

### Models

| Model | Table | Key Relations |
|-------|-------|---------------|
| `User` | `users` | Has many `PracticeSession` |
| `Topic` | `topics` | Has many `PracticeSession` |
| `PracticeSession` | `practice_sessions` | Belongs to `User` + `Topic`; has one `SpeechEvaluation` |
| `SpeechEvaluation` | `speech_evaluations` | Belongs to `PracticeSession` (cascade delete) |

---

## Authentication

- Auth is Supabase JWT-based
- The server validates JWTs using `SUPABASE_JWT_SECRET`
- Use `SUPABASE_SECRET_KEY` (service role) for server-side Supabase admin operations
- Never expose `SUPABASE_SECRET_KEY` to the mobile client

---

## External Services

### Deepgram (transcription)
- SDK: `deepgram-python` (`AsyncDeepgramClient`)
- Endpoint: REST `POST /v1/listen` with Nova-3 model
- Read skill `deepgram-python-speech-to-text` before modifying `services/transcription.py`
- Always handle the fallback path (key absent → simulation)

### OpenAI (evaluation)
- Model: set by `OPENAI_MODEL` env var
- Key: `OPENAI_API_KEY`
- Lives in `services/evaluation.py`

### Supabase Storage
- Bucket: `recordings` (`SUPABASE_STORAGE_BUCKET`)
- Local fallback: `server/uploads/` for dev (audio files served via `/uploads` static mount)
- Read skill `supabase` before modifying storage logic

---

## Code Style

- Python 3.12+ — use `str | None` unions, `match` statements, `Path` objects where natural
- Async routes use `async def`; sync DB sessions use the `SessionLocal` generator pattern
- All settings come from `core/config.py` `Settings` class — never hardcode env vars
- Pydantic v2 schemas for all request/response bodies
- Use typed returns on all public service methods

---

## Testing Mandate

**Write tests for every change. Run tests before declaring any task done.**

```bash
uv run pytest                      # full suite
uv run pytest -k "test_name" -v    # single test
uv run pytest --tb=short           # compact tracebacks
```

- Route tests: `tests/test_api.py` — use `httpx.AsyncClient` with the FastAPI `app`
- Service tests: `tests/test_sdk_services.py` — mock external SDK calls (Deepgram, OpenAI) so tests run without real API keys
- When adding a new router, add corresponding route tests
- When adding a new service method, add a service-layer test

---

## Do Not
- Do not use `pip install` — use `uv add`
- Do not commit secrets or `.env` files
- Do not commit files in `uploads/` (audio data)
- Do not add unversioned API routes — all routes use `/api/v1/` prefix
- Do not edit migration files after they have been applied
- Do not use blocking I/O inside `async def` route handlers — use `asyncio.to_thread` or run sync work in a background task
