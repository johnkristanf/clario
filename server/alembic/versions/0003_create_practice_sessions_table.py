"""create practice_sessions table

Revision ID: 0003_practice_sessions
Revises: 0002_topics
Create Date: 2026-11-20 03:00:02.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0003_practice_sessions'
down_revision: Union[str, Sequence[str], None] = '0002_topics'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'practice_sessions',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('user_id', sa.String(length=64), nullable=False),
        sa.Column('topic_id', sa.Integer(), nullable=True),
        sa.Column('audio_url', sa.String(length=1024), nullable=False),
        sa.Column('duration_seconds', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('status', sa.String(length=32), server_default='processing', nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_practice_sessions_status'), 'practice_sessions', ['status'], unique=False)
    op.create_index(op.f('ix_practice_sessions_topic_id'), 'practice_sessions', ['topic_id'], unique=False)
    op.create_index(op.f('ix_practice_sessions_user_id'), 'practice_sessions', ['user_id'], unique=False)
    op.create_index('idx_practice_sessions_created_at', 'practice_sessions', [sa.text('created_at desc')], unique=False)

    # Enable Row Level Security (RLS)
    op.execute("alter table public.practice_sessions enable row level security")

    # Supabase RLS Policies
    op.execute("""
    do $$
    begin
        if not exists (select 1 from pg_policies where tablename = 'practice_sessions' and policyname = 'sessions_select_own') then
            create policy "sessions_select_own" on public.practice_sessions for select to authenticated using (user_id = (select auth.uid())::text);
        end if;
        if not exists (select 1 from pg_policies where tablename = 'practice_sessions' and policyname = 'sessions_insert_own') then
            create policy "sessions_insert_own" on public.practice_sessions for insert to authenticated with check (user_id = (select auth.uid())::text);
        end if;
        if not exists (select 1 from pg_policies where tablename = 'practice_sessions' and policyname = 'sessions_update_own') then
            create policy "sessions_update_own" on public.practice_sessions for update to authenticated using (user_id = (select auth.uid())::text) with check (user_id = (select auth.uid())::text);
        end if;
        if not exists (select 1 from pg_policies where tablename = 'practice_sessions' and policyname = 'sessions_delete_own') then
            create policy "sessions_delete_own" on public.practice_sessions for delete to authenticated using (user_id = (select auth.uid())::text);
        end if;
    end $$;
    """)

    # Ensure Supabase recordings storage bucket exists
    op.execute("""
    do $$
    begin
        if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
            insert into storage.buckets (id, name, public) values ('recordings', 'recordings', true) on conflict (id) do nothing;
        end if;
    end $$;
    """)


def downgrade() -> None:
    op.drop_table('practice_sessions')
