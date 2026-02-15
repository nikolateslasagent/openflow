"""
Workflow CRUD API routes.

Handles creating, reading, updating, and executing workflows.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Optional

router = APIRouter()


# In-memory store (replace with PostgreSQL in production)
_workflows: dict[str, dict[str, Any]] = {}


class WorkflowCreate(BaseModel):
    name: str
    nodes: list[dict[str, Any]]
    edges: list[dict[str, Any]]


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    nodes: Optional[list[dict[str, Any]]] = None
    edges: Optional[list[dict[str, Any]]] = None


@router.get("/")
async def list_workflows() -> list[dict[str, Any]]:
    """List all workflows."""
    return list(_workflows.values())


@router.post("/")
async def create_workflow(body: WorkflowCreate) -> dict[str, Any]:
    """Create a new workflow."""
    import uuid
    wf_id = str(uuid.uuid4())
    workflow = {
        "id": wf_id,
        "name": body.name,
        "nodes": body.nodes,
        "edges": body.edges,
    }
    _workflows[wf_id] = workflow
    return workflow


@router.get("/{workflow_id}")
async def get_workflow(workflow_id: str) -> dict[str, Any]:
    """Get a workflow by id."""
    if workflow_id not in _workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return _workflows[workflow_id]


@router.patch("/{workflow_id}")
async def update_workflow(workflow_id: str, body: WorkflowUpdate) -> dict[str, Any]:
    """Update a workflow."""
    if workflow_id not in _workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")
    wf = _workflows[workflow_id]
    if body.name is not None:
        wf["name"] = body.name
    if body.nodes is not None:
        wf["nodes"] = body.nodes
    if body.edges is not None:
        wf["edges"] = body.edges
    return wf


@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: str) -> dict[str, str]:
    """Delete a workflow."""
    if workflow_id not in _workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")
    del _workflows[workflow_id]
    return {"status": "deleted"}
