# Clario — Monorepo Agent Guide

> AI-powered articulation tool that helps users to clarify thoughts, organize ideas, and speak confidently through consistent daily articulation practice.
> Android-first. Material Design 3. Single-tap voice capture.

---

## Monorepo Layout

```
clario/
├── mobile/        # React Native / Expo SDK 58, Expo Router, Android-first
│   └── AGENTS.md  # ← Mobile-specific agent rules (read when working in mobile/)
├── server/        # Python 3.12, FastAPI, SQLAlchemy, Alembic
│   └── AGENTS.md  # ← Server-specific agent rules (read when working in server/)
├── supabase/
│   └── migrations/ # SQL migrations via Supabase CLI
├── PRODUCT.md     # Canonical product strategy, users, principles
└── AGENTS.md      # ← You are here
```

**Always read the workspace-level AGENTS.md** before touching code in that workspace. This file covers shared architecture and conventions; workspace files carry the precise build, test, and style rules.

---

## Product Context

Clario is an AI-powered articulation tool that helps users clarify thoughts, organize ideas, and speak confidently through consistent daily articulation practice. The pipeline:

1. **Mobile** records audio → uploads to **FastAPI server**
2. **Server** runs a 3-stage pipeline:
   - **Librosa** — acoustic analysis (pauses, pace, vocal steadiness)
   - **Deepgram Nova-3** — STT transcription + filler word detection
   - **OpenAI** — 7-dimension evaluation + coaching feedback
3. Results stored in **Supabase Postgres** (`practice_sessions` → `speech_evaluations`)
4. **Mobile** polls for evaluation and displays results

---

## Architecture

```
Mobile (Expo/RN)
   │  POST /api/v1/sessions       (upload WAV, start pipeline)
   │  GET  /api/v1/sessions/{id}/progress  (poll status)
   │  GET  /api/v1/evaluations/{id}        (fetch results)
   ▼
FastAPI Server (Python 3.12 + uv)
   ├── routers/        auth, topics, sessions, evaluations
   ├── services/
   │     ├── pipeline.py      orchestrates the 3 stages
   │     ├── acoustic.py      Librosa analysis
   │     ├── transcription.py Deepgram Nova-3 REST (async)
   │     ├── evaluation.py    OpenAI GPT evaluation
   │     └── storage.py       Supabase Storage / local uploads
   ├── models/          SQLAlchemy ORM
   ├── schemas/         Pydantic request/response
   └── alembic/         DB migrations

Supabase (hosted Postgres + Auth + Storage)
   ├── users
   ├── topics
   ├── practice_sessions
   └── speech_evaluations
```

---

## External Services

### Deepgram
- Used for: speech-to-text transcription of uploaded WAV audio
- Model: **Nova-3** via REST `POST /v1/listen`
- SDK: `deepgram-python` (`AsyncDeepgramClient`)
- Key env var: `DEEPGRAM_API_KEY`
- Fallback: service simulates a transcript when key is absent (dev mode)
- Read skill: `deepgram-python-speech-to-text` before modifying `services/transcription.py`

### OpenAI
- Used for: 7-dimension speech evaluation (clarity, structure, fluency, vocabulary, grammar, relevance, confidence) + coaching text
- Model: configured via `OPENAI_MODEL` env var (currently `gpt-6-luna`)
- Key env var: `OPENAI_API_KEY`

### Supabase
- Used for: Postgres DB, Auth (JWT), Storage bucket (`recordings`)
- Server uses **service-role secret key** (`SUPABASE_SECRET_KEY`) — never expose to mobile
- Mobile uses **publishable/anon key** (`SUPABASE_PUBLISHABLE_KEY`)
- Read skill: `supabase` and `supabase-postgres-best-practices` before schema/migration work

---

## Shared Conventions

### Secrets & Environment
- `.env` files are **gitignored** — never commit secrets
- Reference `.env.example` to understand required variables
- Mobile secrets: `mobile/.env` (prefixed `EXPO_PUBLIC_` for client-visible vars)
- Server secrets: `server/.env`

### Database Changes
1. Write a new Alembic migration: `cd server && uv run alembic revision --autogenerate -m "describe change"`
2. Apply locally: `uv run alembic upgrade head`
3. Update `server/SCHEMA.md` to reflect the new schema
4. Never edit existing migration files; always add new ones

### API Versioning
- All server routes are prefixed `/api/v1/`
- Do not add unversioned routes

### Audio Files
- Uploaded WAV files live in `server/uploads/` locally and in Supabase Storage bucket `recordings` in production
- Never commit audio files to git

---

## Testing Mandate

**Write tests for every change.**

| Workspace | Command | Coverage target |
|-----------|---------|-----------------|
| `server/` | `uv run pytest` | All new services, routers, and utilities |
| `mobile/` | `npx expo lint` + `npx tsc --noEmit` | Type-check + lint passes before PR |

- Server tests live in `server/tests/`; use `pytest` with `httpx` for FastAPI route tests
- Do not declare a task done until all tests pass
- When modifying the pipeline, add or update integration tests in `test_sdk_services.py`

---

## Working in This Repo

### Quick Reference

| Task | Go to |
|------|-------|
| Mobile UI / navigation | `mobile/` → read `mobile/AGENTS.md` |
| API routes / business logic | `server/routers/` + `server/services/` |
| DB schema / migrations | `server/alembic/versions/` + `server/SCHEMA.md` |
| Product decisions | `PRODUCT.md` |
| Deepgram transcription | `server/services/transcription.py` |
| Acoustic analysis | `server/services/acoustic.py` |
| AI evaluation | `server/services/evaluation.py` |
| Auth flows | `server/routers/auth.py` + `server/services/supabase.py` |

### Do Not
- Do not modify `server/.venv/` or `mobile/node_modules/` directly
- Do not edit generated Expo native directories (`ios/`, `android/`) — use `app.json` and config plugins
- Do not use `pip install` directly — use `uv add` in the server workspace
- Do not use `npm install <pkg>` in mobile — use `npx expo install <pkg>` for SDK-compatible versions
- Do not fabricate benchmark numbers or user quotes — `PRODUCT.md` explicitly notes no real user data exists yet
