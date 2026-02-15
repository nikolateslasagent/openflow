"""Authentication routes — GitHub OAuth + API key management."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/me")
async def get_current_user() -> dict:
    """Return current user info. Placeholder for auth implementation."""
    return {"user": None, "authenticated": False}
