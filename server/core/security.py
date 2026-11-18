"""
JWT verification using Supabase Auth.

Supabase signs JWTs with the project's JWT secret (available in the Supabase
dashboard → Settings → API → JWT Secret). The Publishable Key is NOT the JWT
secret; the JWT secret is a separate value used to verify tokens server-side.

For server-side verification without calling the Auth API on every request:
  - Set SUPABASE_JWT_SECRET in .env (copy from Dashboard → Settings → API)
  - decode_supabase_token() verifies the signature locally (fast, no network)

For situations where the JWT secret is not available or as a double-check:
  - verify_supabase_user() in services/supabase.py calls the Supabase Auth API
"""

from __future__ import annotations

import logging
from typing import Any

import jwt

from core.config import settings

logger = logging.getLogger(__name__)

SUPABASE_JWT_ALGORITHMS = ["HS256"]


def decode_supabase_token(access_token: str) -> dict[str, Any] | None:
    """
    Verifies and decodes a Supabase JWT using the project JWT secret.
    Returns the payload dict on success, None on any failure.

    Requires SUPABASE_JWT_SECRET in settings (from Supabase Dashboard → Settings → API).
    """
    secret = settings.SUPABASE_JWT_SECRET
    if not secret:
        logger.debug("SUPABASE_JWT_SECRET not set; skipping local JWT verification")
        return None
    try:
        payload: dict[str, Any] = jwt.decode(
            access_token,
            secret,
            algorithms=SUPABASE_JWT_ALGORITHMS,
            options={"verify_aud": False},  # Supabase audience varies; skip aud check
        )
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Supabase JWT expired")
    except jwt.InvalidTokenError as exc:
        logger.warning("Supabase JWT invalid: %s", exc)
    return None


def get_uid_from_token(access_token: str) -> str | None:
    """Returns the Supabase Auth user ID (sub claim) from a valid JWT, or None."""
    payload = decode_supabase_token(access_token)
    if payload:
        return payload.get("sub")
    return None
