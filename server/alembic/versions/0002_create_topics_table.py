"""create topics table

Revision ID: 0002_topics
Revises: 0001_users
Create Date: 2026-11-20 03:00:01.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0002_topics'
down_revision: Union[str, Sequence[str], None] = '0001_users'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'topics',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('category', sa.String(length=64), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('prompt', sa.Text(), nullable=False),
        sa.Column('difficulty', sa.String(length=32), server_default='Intermediate', nullable=False),
        sa.Column('prep_time_seconds', sa.Integer(), server_default='30', nullable=False),
        sa.Column('speaking_time_seconds', sa.Integer(), server_default='120', nullable=False),
        sa.Column('suggested_framework', sa.String(length=128), server_default='PREP Framework', nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_topics_category'), 'topics', ['category'], unique=False)
    op.create_index(op.f('ix_topics_difficulty'), 'topics', ['difficulty'], unique=False)
    op.create_index(op.f('ix_topics_is_active'), 'topics', ['is_active'], unique=False)

    # Enable Row Level Security (RLS)
    op.execute("alter table public.topics enable row level security")

    # Supabase RLS Policies
    op.execute("""
    do $$
    begin
        if not exists (select 1 from pg_policies where tablename = 'topics' and policyname = 'topics_select_active') then
            create policy "topics_select_active" on public.topics for select to authenticated, anon using (is_active = true);
        end if;
    end $$;
    """)


def downgrade() -> None:
    op.drop_table('topics')
