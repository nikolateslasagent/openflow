"""Generation history API — browse past generations and their data."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_generations() -> list[dict]:
    """List recent generations. Placeholder for database query."""
    return []


@router.get("/stats")
async def generation_stats() -> dict:
    """Return aggregate stats on captured training data."""
    return {"total": 0, "by_type": {}, "by_provider": {}}
