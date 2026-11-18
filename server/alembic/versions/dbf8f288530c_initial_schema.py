"""initial_schema

Revision ID: dbf8f288530c
Revises: 
Create Date: 2026-11-19 05:25:36.189408

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dbf8f288530c'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Foreign Key & Performance Indexes
    op.execute("create index if not exists idx_practice_sessions_user_id on public.practice_sessions(user_id)")
    op.execute("create index if not exists idx_practice_sessions_topic_id on public.practice_sessions(topic_id)")
    op.execute("create index if not exists idx_practice_sessions_status on public.practice_sessions(status)")
    op.execute("create index if not exists idx_practice_sessions_created_at on public.practice_sessions(created_at desc)")
    op.execute("create index if not exists idx_speech_evaluations_session_id on public.speech_evaluations(session_id)")
    op.execute("create index if not exists idx_topics_category on public.topics(category)")
    op.execute("create index if not exists idx_topics_difficulty on public.topics(difficulty)")
    op.execute("create index if not exists idx_topics_is_active on public.topics(is_active)")

    # 2. Enable Row Level Security (RLS) on all exposed public tables
    op.execute("alter table public.users enable row level security")
    op.execute("alter table public.topics enable row level security")
    op.execute("alter table public.practice_sessions enable row level security")
    op.execute("alter table public.speech_evaluations enable row level security")

    # 3. Supabase RLS Policies (Cached subquery (select auth.uid()) for 100x+ performance)
    op.execute("""
    do $$
    begin
        if not exists (select 1 from pg_policies where policyname = 'users_select_own') then
            create policy "users_select_own" on public.users for select to authenticated using (id = (select auth.uid())::text);
        end if;
        if not exists (select 1 from pg_policies where policyname = 'users_insert_own') then
            create policy "users_insert_own" on public.users for insert to authenticated with check (id = (select auth.uid())::text);
        end if;
        if not exists (select 1 from pg_policies where policyname = 'users_update_own') then
            create policy "users_update_own" on public.users for update to authenticated using (id = (select auth.uid())::text) with check (id = (select auth.uid())::text);
        end if;
        if not exists (select 1 from pg_policies where policyname = 'topics_select_active') then
            create policy "topics_select_active" on public.topics for select to authenticated, anon using (is_active = true);
        end if;
        if not exists (select 1 from pg_policies where policyname = 'sessions_select_own') then
            create policy "sessions_select_own" on public.practice_sessions for select to authenticated using (user_id = (select auth.uid())::text);
        end if;
        if not exists (select 1 from pg_policies where policyname = 'sessions_insert_own') then
            create policy "sessions_insert_own" on public.practice_sessions for insert to authenticated with check (user_id = (select auth.uid())::text);
        end if;
        if not exists (select 1 from pg_policies where policyname = 'sessions_update_own') then
            create policy "sessions_update_own" on public.practice_sessions for update to authenticated using (user_id = (select auth.uid())::text) with check (user_id = (select auth.uid())::text);
        end if;
        if not exists (select 1 from pg_policies where policyname = 'sessions_delete_own') then
            create policy "sessions_delete_own" on public.practice_sessions for delete to authenticated using (user_id = (select auth.uid())::text);
        end if;
        if not exists (select 1 from pg_policies where policyname = 'evaluations_select_own') then
            create policy "evaluations_select_own" on public.speech_evaluations for select to authenticated using (
                exists (
                    select 1 from public.practice_sessions s
                    where s.id = speech_evaluations.session_id
                      and s.user_id = (select auth.uid())::text
                )
            );
        end if;
    end $$;
    """)

    # 4. Storage Bucket Setup
    op.execute("insert into storage.buckets (id, name, public) values ('recordings', 'recordings', true) on conflict (id) do nothing")


def downgrade() -> None:
    op.execute("alter table public.speech_evaluations disable row level security")
    op.execute("alter table public.practice_sessions disable row level security")
    op.execute("alter table public.topics disable row level security")
    op.execute("alter table public.users disable row level security")
