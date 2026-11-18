# Clario Database Schema

Database architecture for the Clario articulation tool.

```mermaid
erDiagram
    users ||--o{ practice_sessions : "has many"
    topics ||--o{ practice_sessions : "categorizes"
    practice_sessions ||--|| speech_evaluations : "evaluated by"

    users {
        string id PK "UUID / Supabase Auth UID"
        string email "Indexed, nullable"
        string full_name "User display name"
        string avatar_url "Profile avatar URL"
        string auth_provider "supabase_google"
        timestamp created_at "UTC creation timestamp"
        timestamp updated_at "UTC update timestamp"
    }

    topics {
        int id PK "Autoincrement ID"
        string category "Indexed (8 categories)"
        string title "Topic title"
        text prompt "Challenge question/prompt"
        string difficulty "Beginner, Intermediate, Advanced"
        int prep_time_seconds "Default 30 seconds"
        int speaking_time_seconds "Default 120 seconds"
        string suggested_framework "PREP, STAR, Rule of Three"
        boolean is_active "Active status flag"
        timestamp created_at "UTC creation timestamp"
        timestamp updated_at "UTC update timestamp"
    }

    practice_sessions {
        string id PK "UUID"
        string user_id FK "users.id (CASCADE)"
        int topic_id FK "topics.id (SET NULL)"
        string audio_url "Storage URL / local uploads path"
        float duration_seconds "Total audio length in seconds"
        string status "processing, completed, failed"
        text error_message "Failure explanation if any"
        timestamp created_at "UTC creation timestamp"
        timestamp updated_at "UTC update timestamp"
    }

    speech_evaluations {
        string id PK "UUID"
        string session_id FK "practice_sessions.id (UNIQUE, CASCADE)"
        int overall_score "0-100 composite grade"
        int clarity_score "0-100 transcript analysis"
        int structure_score "0-100 transcript analysis"
        int fluency_score "0-100 audio & transcript"
        int vocabulary_score "0-100 transcript analysis"
        int grammar_score "0-100 transcript analysis"
        int relevance_score "0-100 transcript analysis"
        int confidence_score "0-100 audio acoustic analysis"
        float speaking_rate_wpm "Speaking speed (words per minute)"
        int pause_count "Total pauses detected >= 0.6s"
        float long_pauses_duration "Cumulative long pauses >= 2.0s"
        int filler_words_count "Count of filler words"
        json filler_words_list "Objects: word, count, timestamps"
        float vocal_steadiness_score "0-100 pitch & spectral stability"
        float volume_variation_score "0-100 RMS dynamic range"
        text transcript "Full punctuated speech transcript"
        json word_timings "Array: word, start, end, is_filler, is_repeated"
        json pauses "Array: start, end, duration"
        json strengths "List of 'What you did well' bullet points"
        json improvements "List of 'Areas to improve' bullet points"
        string suggested_framework "e.g. PREP Framework"
        text framework_advice "Actionable coaching guidance"
        text comparison_to_previous "Longitudinal progression note"
        timestamp created_at "UTC creation timestamp"
        timestamp updated_at "UTC update timestamp"
    }
```

## Relationships

| Parent Table | Relationship | Child Table | Foreign Key | On Delete |
|---|---|---|---|---|
| `users` | 1-to-Many | `practice_sessions` | `practice_sessions.user_id` | `CASCADE` |
| `topics` | 1-to-Many | `practice_sessions` | `practice_sessions.topic_id` | `SET NULL` |
| `practice_sessions` | 1-to-1 | `speech_evaluations` | `speech_evaluations.session_id` | `CASCADE` |
