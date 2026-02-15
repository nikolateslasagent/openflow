<![CDATA["""Generation Data Collector.

Captures every AI generation event on the platform and writes it to
append-only JSONL files organized by date. This data powers the training
dataset flywheel — especially for video generation data.

Each record captures:
- Generation metadata (id, user, workflow, node, timestamp)
- Provider and model info
- Full input parameters (prompt, dimensions, seed, guidance, steps, etc.)
- Output metadata (URL, file size, duration for video)
- Video-specific fields (frame count, FPS, motion score, camera movement)
- Performance metrics (latency, cost)

File layout:
    data/generations/YYYY/MM/DD/generations.jsonl

Usage:
    collector = GenerationCollector()
    collector.log(generation_record)
"""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


# Default storage root — override via DATA_DIR environment variable
DATA_DIR = Path(os.getenv("DATA_DIR", "data/generations"))


class GenerationRecord:
    """A single generation event with all captured fields.

    This mirrors the schema defined in DEV.md. All fields are optional
    except `provider`, `model`, and `type` so that partial records from
    failed generations are still logged.

    Attributes:
        id: Unique generation identifier (auto-generated if not provided).
        user_id: Anonymized user identifier.
        workflow_id: ID of the workflow that triggered this generation.
        node_id: ID of the specific node within the workflow.
        timestamp: ISO 8601 timestamp (auto-set to now if not provided).
        provider: Model provider (e.g., "replicate", "openai", "ollama").
        model: Model identifier (e.g., "wan-2.6", "flux-1.1-pro").
        type: Generation type — "image", "video", "text", or "audio".
        input_params: Full input parameters dict (prompt, dimensions, seed, etc.).
        output_meta: Output metadata dict (url, file_size_bytes, duration_ms, frames).
        video_meta: Video-specific metadata (motion_score, camera_movement, codec, etc.).
        metrics: Performance metrics (latency_ms, cost_usd).
    """

    def __init__(
        self,
        provider: str,
        model: str,
        type: str,
        *,
        id: str | None = None,
        user_id: str = "anonymous",
        workflow_id: str | None = None,
        node_id: str | None = None,
        timestamp: str | None = None,
        input_params: dict[str, Any] | None = None,
        output_meta: dict[str, Any] | None = None,
        video_meta: dict[str, Any] | None = None,
        metrics: dict[str, Any] | None = None,
    ) -> None:
        self.id = id or f"gen_{uuid.uuid4().hex[:12]}"
        self.user_id = user_id
        self.workflow_id = workflow_id
        self.node_id = node_id
        self.timestamp = timestamp or datetime.now(timezone.utc).isoformat()
        self.provider = provider
        self.model = model
        self.type = type
        self.input_params = input_params or {}
        self.output_meta = output_meta or {}
        self.video_meta = video_meta or {}
        self.metrics = metrics or {}

    def to_dict(self) -> dict[str, Any]:
        """Serialize the record to a flat dictionary for JSONL output."""
        record: dict[str, Any] = {
            "id": self.id,
            "user_id": self.user_id,
            "workflow_id": self.workflow_id,
            "node_id": self.node_id,
            "timestamp": self.timestamp,
            "provider": self.provider,
            "model": self.model,
            "type": self.type,
            "input": self.input_params,
            "output": self.output_meta,
            "metrics": self.metrics,
        }
        # Only include video_meta for video generations to keep records lean
        if self.type == "video" and self.video_meta:
            record["video_meta"] = self.video_meta
        return record


class GenerationCollector:
    """Append-only JSONL writer for generation data.

    Records are written to date-partitioned files so they can be
    efficiently bulk-exported to Parquet or uploaded to S3.
    """

    def __init__(self, data_dir: Path | str | None = None) -> None:
        """Initialize the collector.

        Args:
            data_dir: Root directory for JSONL files. Defaults to DATA_DIR.
        """
        self.data_dir = Path(data_dir) if data_dir else DATA_DIR

    def _get_file_path(self, dt: datetime) -> Path:
        """Build the date-partitioned file path.

        Args:
            dt: Timestamp used to determine the partition (YYYY/MM/DD).

        Returns:
            Path to the JSONL file for the given date.
        """
        return self.data_dir / dt.strftime("%Y/%m/%d") / "generations.jsonl"

    def log(self, record: GenerationRecord) -> Path:
        """Write a generation record to the appropriate JSONL file.

        Args:
            record: The generation record to persist.

        Returns:
            Path to the file the record was written to.
        """
        dt = datetime.fromisoformat(record.timestamp)
        filepath = self._get_file_path(dt)
        filepath.parent.mkdir(parents=True, exist_ok=True)

        with open(filepath, "a", encoding="utf-8") as f:
            f.write(json.dumps(record.to_dict(), ensure_ascii=False) + "\n")

        return filepath

    def log_dict(self, data: dict[str, Any]) -> Path:
        """Convenience method to log a raw dictionary.

        Wraps the dict in a GenerationRecord, filling in defaults
        for any missing fields.

        Args:
            data: Raw generation data dictionary.

        Returns:
            Path to the file the record was written to.
        """
        record = GenerationRecord(
            provider=data.get("provider", "unknown"),
            model=data.get("model", "unknown"),
            type=data.get("type", "unknown"),
            id=data.get("id"),
            user_id=data.get("user_id", "anonymous"),
            workflow_id=data.get("workflow_id"),
            node_id=data.get("node_id"),
            timestamp=data.get("timestamp"),
            input_params=data.get("input"),
            output_meta=data.get("output"),
            video_meta=data.get("video_meta"),
            metrics=data.get("metrics"),
        )
        return self.log(record)
]]>