"""Node registry API — returns available node types for the UI palette."""

from fastapi import APIRouter
from app.nodes.base import get_registry

router = APIRouter()


@router.get("/")
async def list_nodes() -> list[dict]:
    """Return all registered node definitions for the frontend."""
    registry = get_registry()
    return [cls().to_dict() for cls in registry.values()]
