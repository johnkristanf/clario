"""create speech_evaluations table

Revision ID: 0004_speech_evaluations
Revises: 0003_practice_sessions
Create Date: 2026-11-20 03:00:03.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0004_speech_evaluations'
down_revision: Union[str, Sequence[str], None] = '0003_practice_sessions'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'speech_evaluations',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('session_id', sa.String(length=64), nullable=False),
        sa.Column('overall_score', sa.Integer(), server_default='0', nullable=False),
        sa.Column('clarity_score', sa.Integer(), server_default='0', nullable=False),
        sa.Column('structure_score', sa.Integer(), server_default='0', nullable=False),
        sa.Column('fluency_score', sa.Integer(), server_default='0', nullable=False),
        sa.Column('vocabulary_score', sa.Integer(), server_default='0', nullable=False),
        sa.Column('grammar_score', sa.Integer(), server_default='0', nullable=False),
        sa.Column('relevance_score', sa.Integer(), server_default='0', nullable=False),
        sa.Column('confidence_score', sa.Integer(), server_default='0', nullable=False),
        sa.Column('speaking_rate_wpm', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('pause_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('long_pauses_duration', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('filler_words_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('filler_words_list', sa.JSON(), server_default='[]', nullable=False),
        sa.Column('vocal_steadiness_score', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('volume_variation_score', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('transcript', sa.Text(), server_default='', nullable=False),
        sa.Column('word_timings', sa.JSON(), server_default='[]', nullable=False),
        sa.Column('pauses', sa.JSON(), server_default='[]', nullable=False),
        sa.Column('strengths', sa.JSON(), server_default='[]', nullable=False),
        sa.Column('improvements', sa.JSON(), server_default='[]', nullable=False),
        sa.Column('suggested_framework', sa.String(length=128), server_default='PREP Framework', nullable=True),
        sa.Column('framework_advice', sa.Text(), nullable=True),
        sa.Column('comparison_to_previous', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['practice_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_speech_evaluations_session_id'), 'speech_evaluations', ['session_id'], unique=True)

    # Enable Row Level Security (RLS)
    op.execute("alter table public.speech_evaluations enable row level security")

    # Supabase RLS Policies
    op.execute("""
    do $$
    begin
        if not exists (select 1 from pg_policies where tablename = 'speech_evaluations' and policyname = 'evaluations_select_own') then
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


def downgrade() -> None:
    op.drop_table('speech_evaluations')
