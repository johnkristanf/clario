import logging
import mimetypes
import uuid
from pathlib import Path
import httpx
from core.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    @staticmethod
    async def save_audio_file(file_content: bytes, filename: str) -> tuple[str, str]:
        """
        Saves uploaded audio file either to Supabase Storage or local disk.
        Returns: (accessible_audio_url_or_path, local_file_path_for_librosa)
        """
        extension = Path(filename).suffix or ".m4a"
        unique_name = f"{uuid.uuid4()}{extension}"
        local_dir = settings.upload_path
        local_path = local_dir / unique_name

        # Always save a local copy for Librosa audio processing
        with open(local_path, "wb") as f:
            f.write(file_content)

        # Upload to Supabase Storage if configured (using Secret Key for server-side authorization)
        api_key = settings.supabase_secret or settings.supabase_publishable
        if settings.SUPABASE_URL and api_key:
            content_type = mimetypes.guess_type(filename)[0] or ("audio/m4a" if extension == ".m4a" else "audio/wav")
            url = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/{settings.SUPABASE_STORAGE_BUCKET}/{unique_name}"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "apikey": api_key,
                "Content-Type": content_type,
                "x-upsert": "true",
            }
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(url, headers=headers, content=file_content)
                    if resp.status_code in (200, 201):
                        public_url = f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/public/{settings.SUPABASE_STORAGE_BUCKET}/{unique_name}"
                        return public_url, str(local_path)
                    logger.warning("Supabase storage upload returned status %d: %s", resp.status_code, resp.text)
            except Exception as e:
                logger.warning("Supabase upload failed, falling back to local: %s", e)

        # Local storage fallback URL
        public_url = f"/uploads/{unique_name}"
        return public_url, str(local_path)


storage_service = StorageService()
