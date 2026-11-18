# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

Consumers seeking clarity, focus, and simplified daily routines. Individuals who want to capture thoughts, voice notes, and daily plans on-the-go without friction or cognitive overload.

## Product Purpose

Clario is an AI-powered voice assistant and smart dictation mobile app that helps users transform spoken thoughts into structured clarity, clear actions, and calm daily routines. Success means frictionless voice capture, rapid transcription with intelligent distillation, and low-stress organization that respects user attention.

## Positioning

Unlike complex business transcription tools or cluttered productivity apps, Clario focuses on consumer mental clarity: one-tap spoken input, instant distillation into actionable thoughts and routines, and clean Material Design 3 ergonomics tailored for everyday Android users.

## Operating Context

- Mobile on-the-go, during morning routines, commutes, walks, or evening wind-downs.
- One-handed, one-tap voice interaction where typing is inconvenient or slow.
- Android-first environment: integration with system audio, predictive back navigation, Material You / Material 3 dynamic theming, and edge-to-edge window insets.

## Capabilities and Constraints

- **Mobile client (`/mobile`):** React Native / Expo (SDK 58), Expo Router, Android-first Material Design 3 interaction patterns, 48x48dp touch targets, sp typography scaling.
- **Backend service (`/server`):** Python FastAPI backend, SQLAlchemy 2.0 async, Alembic migrations, PostgreSQL/SQLite.
- **Audio & Intelligence:** Voice recording, speech-to-text processing, and intelligent thought structuring/summarization.
- **Explicitly undecided / open decisions:** Specific speech-to-text engine and streaming vs batch transcription models; offline voice buffering strategy; cloud sync vs local-first storage boundaries.

## Brand Commitments

- **Name:** Clario (evoking clarity, lightness, calmness, and precision).
- **Tone & Voice:** Calm, encouraging, concise, and transparent. No technical jargon, no overwhelming dashboards.
- **Visual Direction:** Material Design 3 first-class citizen (tonal elevation, expressive shapes, clear hierarchy, dark mode support).

## Evidence on Hand

- Project monorepo initialized with Expo Router scaffold in `mobile/` and FastAPI backend scaffold in `server/`.
- No user-facing marketing copy, customer testimonials, or real user audio data on hand yet; future work must not fabricate benchmarks or customer quotes.

## Product Principles

1. **Frictionless Voice First:** The distance between a thought and its capture should be a single tap and zero cognitive overhead.
2. **Clarity Over Clutter:** Synthesize and organize information into clear, bite-sized units rather than dumping walls of raw transcripts.
3. **Calm & Respectful:** Don't harass users with aggressive notifications or gamification; celebrate focus and mental peace.
4. **Android Native Fluent:** Act and feel like an exemplary Android app following Material Design 3 guidelines, gestures, and OS conventions.

## Accessibility & Inclusion

- Adhere to Android accessibility standards: minimum 48x48dp touch targets with >=8dp spacing.
- Support Android system font scaling (`sp` units, tested with large font scales) and high-contrast / dark theme modes.
- Visual and haptic feedback accompanying all audio recording states for users with auditory or visual impairments.
