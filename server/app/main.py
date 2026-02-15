<![CDATA["""OpenFlow Backend — FastAPI Application Entry Point.

This module initializes the FastAPI app, configures CORS middleware,
sets up WebSocket support for real-time generation streaming, and
defines the core API routes.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")


# ---------------------------------------------------------------------------
# Application Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage startup and shutdown events.

    On startup: initialize database connections, register nodes.
    On shutdown: close connections gracefully.
    """
    # Startup
    print("🌊 OpenFlow starting up...")
    yield
    # Shutdown
    print("🌊 OpenFlow shutting down...")


# ---------------------------------------------------------------------------
# App Instance
# ---------------------------------------------------------------------------

app = FastAPI(
    title="OpenFlow",
    description="Open-source visual AI workflow builder — REST & WebSocket API.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Connection Manager (WebSocket)
# ---------------------------------------------------------------------------

class ConnectionManager:
    """Manage active WebSocket connections for real-time streaming.

    Each connection is associated with a workflow execution session so the
    frontend can receive live progress updates (percentage, previews, logs).
    """

    def __init__(self) -> None:
        self.active: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        self.active.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        """Remove a disconnected WebSocket."""
        self.active.remove(websocket)

    async def broadcast(self, message: dict) -> None:
        """Send a JSON message to all connected clients."""
        for ws in self.active:
            await ws.send_json(message)


manager = ConnectionManager()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/")
async def root() -> dict[str, str]:
    """Health-check endpoint."""
    return {"status": "ok", "service": "openflow", "version": "0.1.0"}


@app.get("/api/nodes")
async def list_nodes() -> dict[str, list[dict]]:
    """Return the registry of available node types.

    Each entry includes the node's name, category, description,
    and its typed input/output schema so the frontend can render
    the correct handles and form fields.
    """
    from app.nodes.base import BaseNode

    registry = []
    for subclass in BaseNode.__subclasses__():
        registry.append({
            "name": subclass.__name__,
            "category": getattr(subclass, "category", "general"),
            "description": getattr(subclass, "description", ""),
            "inputs": getattr(subclass, "inputs", {}),
            "outputs": getattr(subclass, "outputs", {}),
        })
    return {"nodes": registry}


@app.post("/api/workflows/execute")
async def execute_workflow(workflow: dict) -> dict:
    """Execute a workflow DAG.

    Accepts a JSON workflow definition containing nodes and edges,
    runs the DAG executor, and returns the results.

    Args:
        workflow: Serialized workflow with "nodes" and "edges" keys.

    Returns:
        Execution results keyed by node ID.
    """
    from app.engine.executor import WorkflowExecutor

    executor = WorkflowExecutor()
    results = executor.execute(workflow)
    return {"status": "completed", "results": results}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """WebSocket endpoint for real-time generation progress.

    Clients connect here to receive streaming updates during
    workflow execution: progress percentages, preview images,
    log messages, and completion notifications.
    """
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Handle incoming commands (e.g., cancel execution)
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
]]>