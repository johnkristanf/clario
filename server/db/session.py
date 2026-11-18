from collections.abc import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from core.config import settings
from db.utils import normalize_database_url


def _build_engine():
    url = normalize_database_url(settings.DATABASE_URL)

    # Supabase Postgres best practices (PgBouncer transaction mode):
    # - pool_size: 5 (safe connection limit for serverless/app instances)
    # - max_overflow: 10 (burst headroom)
    # - pool_pre_ping: True (discards dropped connections before use)
    # - pool_recycle: 300s (recycles before pgbouncer idle timeout)
    # - prepare_threshold: 0 (disables prepared statements for pgbouncer transaction mode)
    return create_engine(
        url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        pool_recycle=300,
        connect_args={"prepare_threshold": 0},
    )


engine = _build_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency that yields a database session and closes it when done."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
