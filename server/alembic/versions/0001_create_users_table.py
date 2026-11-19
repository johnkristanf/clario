"""create users table

Revision ID: 0001_users
Revises: 
Create Date: 2026-11-20 03:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0001_users'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('full_name', sa.String(length=255), nullable=True),
        sa.Column('avatar_url', sa.String(length=1024), nullable=True),
        sa.Column('auth_provider', sa.String(length=50), server_default='supabase_google', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # Enable Row Level Security (RLS)
    op.execute("alter table public.users enable row level security")

    # Supabase RLS Policies
    op.execute("""
    do $$
    begin
        if not exists (select 1 from pg_policies where tablename = 'users' and policyname = 'users_select_own') then
            create policy "users_select_own" on public.users for select to authenticated using (id = (select auth.uid())::text);
        end if;
        if not exists (select 1 from pg_policies where tablename = 'users' and policyname = 'users_insert_own') then
            create policy "users_insert_own" on public.users for insert to authenticated with check (id = (select auth.uid())::text);
        end if;
        if not exists (select 1 from pg_policies where tablename = 'users' and policyname = 'users_update_own') then
            create policy "users_update_own" on public.users for update to authenticated using (id = (select auth.uid())::text) with check (id = (select auth.uid())::text);
        end if;
    end $$;
    """)


def downgrade() -> None:
    op.drop_table('users')
