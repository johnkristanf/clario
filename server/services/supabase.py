import logging
import httpx
from core.config import settings

logger = logging.getLogger(__name__)


async def verify_supabase_user(access_token: str) -> dict | None:
    """Verifies a Supabase JWT access token against the Supabase Auth server."""
    if not settings.SUPABASE_URL:
        return None
    api_key = settings.supabase_secret or settings.supabase_publishable
    if not api_key:
        return None

    url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "apikey": api_key,
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                return resp.json()
            logger.warning("Supabase Auth verification returned status %d", resp.status_code)
    except Exception as e:
        logger.warning("Supabase Auth verification request failed: %s", e)
    return None
