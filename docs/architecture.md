# Architecture

## Overview

OpenFlow is a three-tier application:

```
Frontend (React + React Flow)
    ↕ REST + WebSocket
Backend (FastAPI + Python)
    ↕
Storage (PostgreSQL + Redis + S3)
```

## Frontend

The web UI is a React application built around **React Flow** for the node-based canvas editor. Key modules:

- **Canvas** — React Flow instance with custom node rendering
- **Node Palette** — Sidebar listing available nodes by category
- **Properties Panel** — Edit selected node's input values
- **Output Preview** — Shows generation results inline
- **Zustand Store** — Global state: workflow, execution status, UI panels

## Backend

The Python backend handles:

- **Node Registry** — Auto-discovers BaseNode subclasses, serves definitions to frontend
- **Workflow API** — CRUD for workflows (stored in PostgreSQL)
- **DAG Executor** — Topological sort → sequential execution with async cancellation
- **Provider Adapters** — Uniform interface over OpenAI, Replicate, fal.ai, Ollama, etc.
- **Data Collector** — Logs every generation to JSONL (prompt, params, output, latency)
- **WebSocket** — Streams real-time execution progress to the frontend

## Data Pipeline

Every generation that flows through OpenFlow is captured:

1. Node executes → `DataCollector.log_generation()` called
2. Record buffered in memory (batch of 100)
3. Flushed to date-partitioned JSONL files: `data/generations/YYYY/MM/DD/generations.jsonl`
4. Separate process uploads to S3 for bulk processing
5. Export scripts convert to Parquet for training pipelines

**Video data gets extra metadata:** frame count, FPS, duration, motion score, camera angles, codec, bitrate.

## Execution Flow

1. User builds workflow on canvas (frontend)
2. Clicks "Run" → workflow JSON sent to `/api/workflows/{id}/execute`
3. Backend parses graph, runs topological sort
4. Nodes executed in order; outputs flow downstream via edges
5. Each node's execution is logged by the data collector
6. Progress streamed to frontend via WebSocket
7. Results displayed in output preview panel
