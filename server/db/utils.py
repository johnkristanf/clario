def normalize_database_url(url: str) -> str:
    """Enforces psycopg3 driver (postgresql+psycopg://) for PostgreSQL connection URLs."""
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://") and not url.startswith("postgresql+"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    if "+psycopg2" in url:
        return url.replace("+psycopg2", "+psycopg", 1)
    return url
