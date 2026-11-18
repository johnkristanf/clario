-- Clario Supabase PostgreSQL Schema & Security Policies
-- Adheres to Supabase Postgres Best Practices:
-- 1. UUID & identity primary keys
-- 2. Indexed foreign keys (prevents slow JOINs and CASCADE full table scans)
-- 3. Row Level Security (RLS) enabled on all exposed tables
-- 4. Cached subquery auth checks: (select auth.uid()) for 100x+ policy evaluation performance
-- 5. Explicit role scoping: TO authenticated / TO anon (auth.role() is deprecated)
-- 6. Storage bucket 'recordings' initialization with RLS policies

-- Enable pgcrypto for gen_random_uuid() if not already enabled
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- Users (mirrors Supabase Auth UID)
create table if not exists public.users (
    id text primary key,
    email text unique,
    full_name text,
    avatar_url text,
    auth_provider text not null default 'supabase_google',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Topics
create table if not exists public.topics (
    id bigint generated always as identity primary key,
    category text not null,
    title text not null,
    prompt text not null,
    difficulty text not null default 'Intermediate',
    prep_time_seconds integer not null default 30,
    speaking_time_seconds integer not null default 120,
    suggested_framework text default 'PREP Framework',
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Practice Sessions
create table if not exists public.practice_sessions (
    id text primary key default gen_random_uuid()::text,
    user_id text not null references public.users(id) on delete cascade,
    topic_id bigint references public.topics(id) on delete set null,
    audio_url text not null,
    duration_seconds double precision not null default 0.0,
    status text not null default 'processing',
    error_message text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Speech Evaluations
create table if not exists public.speech_evaluations (
    id text primary key default gen_random_uuid()::text,
    session_id text not null unique references public.practice_sessions(id) on delete cascade,
    overall_score integer not null default 0,
    clarity_score integer not null default 0,
    structure_score integer not null default 0,
    fluency_score integer not null default 0,
    vocabulary_score integer not null default 0,
    grammar_score integer not null default 0,
    relevance_score integer not null default 0,
    confidence_score integer not null default 0,
    speaking_rate_wpm double precision not null default 0.0,
    pause_count integer not null default 0,
    long_pauses_duration double precision not null default 0.0,
    filler_words_count integer not null default 0,
    filler_words_list jsonb not null default '[]'::jsonb,
    vocal_steadiness_score double precision not null default 0.0,
    volume_variation_score double precision not null default 0.0,
    transcript text not null default '',
    word_timings jsonb not null default '[]'::jsonb,
    pauses jsonb not null default '[]'::jsonb,
    strengths jsonb not null default '[]'::jsonb,
    improvements jsonb not null default '[]'::jsonb,
    suggested_framework text default 'PREP Framework',
    framework_advice text,
    comparison_to_previous text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================================
-- 2. INDEXES (Foreign Keys & Frequent Filter Predicates)
-- ============================================================================

-- Foreign Key Indexes (Best Practice: Postgres does not auto-index FKs)
create index if not exists idx_practice_sessions_user_id on public.practice_sessions(user_id);
create index if not exists idx_practice_sessions_topic_id on public.practice_sessions(topic_id);
create index if not exists idx_practice_sessions_status on public.practice_sessions(status);
create index if not exists idx_practice_sessions_created_at on public.practice_sessions(created_at desc);

create index if not exists idx_speech_evaluations_session_id on public.speech_evaluations(session_id);

create index if not exists idx_topics_category on public.topics(category);
create index if not exists idx_topics_difficulty on public.topics(difficulty);
create index if not exists idx_topics_is_active on public.topics(is_active);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

alter table public.users enable row level security;
alter table public.topics enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.speech_evaluations enable row level security;

-- Users Policies
create policy "users_select_own" on public.users
    for select to authenticated
    using (id = (select auth.uid())::text);

create policy "users_insert_own" on public.users
    for insert to authenticated
    with check (id = (select auth.uid())::text);

create policy "users_update_own" on public.users
    for update to authenticated
    using (id = (select auth.uid())::text)
    with check (id = (select auth.uid())::text);

-- Topics Policies (Public read for active topics)
create policy "topics_select_active" on public.topics
    for select to authenticated, anon
    using (is_active = true);

-- Practice Sessions Policies
create policy "sessions_select_own" on public.practice_sessions
    for select to authenticated
    using (user_id = (select auth.uid())::text);

create policy "sessions_insert_own" on public.practice_sessions
    for insert to authenticated
    with check (user_id = (select auth.uid())::text);

create policy "sessions_update_own" on public.practice_sessions
    for update to authenticated
    using (user_id = (select auth.uid())::text)
    with check (user_id = (select auth.uid())::text);

create policy "sessions_delete_own" on public.practice_sessions
    for delete to authenticated
    using (user_id = (select auth.uid())::text);

-- Speech Evaluations Policies (Scoped through practice session ownership)
create policy "evaluations_select_own" on public.speech_evaluations
    for select to authenticated
    using (
        exists (
            select 1 from public.practice_sessions s
            where s.id = speech_evaluations.session_id
              and s.user_id = (select auth.uid())::text
        )
    );

-- ============================================================================
-- 4. STORAGE SETUP (Bucket & RLS)
-- ============================================================================

-- Create 'recordings' bucket if missing
insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', true)
on conflict (id) do nothing;

-- Storage RLS: Authenticated user upload
create policy "recordings_insert_authenticated" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'recordings');

-- Storage RLS: Public audio read access
create policy "recordings_select_public" on storage.objects
    for select to authenticated, anon
    using (bucket_id = 'recordings');
