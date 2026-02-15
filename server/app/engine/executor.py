<![CDATA["""DAG Workflow Executor.

Executes a workflow graph by performing topological sort on the nodes,
then running each node in dependency order. Outputs from upstream nodes
are passed as inputs to downstream nodes via edge connections.

Workflow format expected:
{
    "nodes": [
        {"id": "node_1", "type": "TextInput", "data": {"text": "A cat"}},
        {"id": "node_2", "type": "ImageGen", "data": {"width": 512}},
    ],
    "edges": [
        {"source": "node_1", "sourceHandle": "text", "target": "node_2", "targetHandle": "prompt"}
    ]
}
"""

from __future__ import annotations

from collections import defaultdict, deque
from typing import Any

from app.nodes.base import BaseNode


# ---------------------------------------------------------------------------
# Node Registry
# ---------------------------------------------------------------------------

def _build_node_registry() -> dict[str, type[BaseNode]]:
    """Build a lookup table from node class name to class.

    Scans all subclasses of BaseNode so that new nodes are automatically
    available without manual registration.
    """
    registry: dict[str, type[BaseNode]] = {}
    queue = deque(BaseNode.__subclasses__())
    while queue:
        cls = queue.popleft()
        registry[cls.__name__] = cls
        queue.extend(cls.__subclasses__())
    return registry


# ---------------------------------------------------------------------------
# Topological Sort
# ---------------------------------------------------------------------------

def topological_sort(nodes: list[dict], edges: list[dict]) -> list[str]:
    """Sort node IDs in execution order using Kahn's algorithm.

    Args:
        nodes: List of node dicts, each with an "id" key.
        edges: List of edge dicts with "source" and "target" keys.

    Returns:
        Ordered list of node IDs, roots first.

    Raises:
        ValueError: If the graph contains a cycle (impossible to execute).
    """
    node_ids = {n["id"] for n in nodes}
    in_degree: dict[str, int] = {nid: 0 for nid in node_ids}
    adjacency: dict[str, list[str]] = defaultdict(list)

    for edge in edges:
        src, tgt = edge["source"], edge["target"]
        adjacency[src].append(tgt)
        in_degree[tgt] += 1

    # Start with nodes that have no incoming edges
    queue = deque(nid for nid, deg in in_degree.items() if deg == 0)
    order: list[str] = []

    while queue:
        nid = queue.popleft()
        order.append(nid)
        for neighbor in adjacency[nid]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    if len(order) != len(node_ids):
        executed = set(order)
        stuck = node_ids - executed
        raise ValueError(
            f"Workflow contains a cycle. These nodes cannot be resolved: {stuck}"
        )

    return order


# ---------------------------------------------------------------------------
# Executor
# ---------------------------------------------------------------------------

class WorkflowExecutor:
    """Execute a workflow DAG from start to finish.

    The executor:
    1. Topologically sorts the nodes to determine execution order.
    2. Instantiates each node using the registry.
    3. Wires outputs from upstream nodes into downstream inputs via edges.
    4. Validates inputs before execution.
    5. Collects and returns all results.
    """

    def __init__(self) -> None:
        self.registry = _build_node_registry()
        self.results: dict[str, dict[str, Any]] = {}

    def execute(self, workflow: dict) -> dict[str, dict[str, Any]]:
        """Execute the full workflow.

        Args:
            workflow: Dict with "nodes" and "edges" lists.

        Returns:
            Dict mapping node ID → output dict from that node's execute().
        """
        nodes = workflow.get("nodes", [])
        edges = workflow.get("edges", [])
        order = topological_sort(nodes, edges)

        # Index nodes by ID for quick lookup
        node_map = {n["id"]: n for n in nodes}

        # Build reverse edge map: target_node_id → list of (source_id, source_handle, target_handle)
        input_map: dict[str, list[tuple[str, str, str]]] = defaultdict(list)
        for edge in edges:
            input_map[edge["target"]].append((
                edge["source"],
                edge.get("sourceHandle", "output"),
                edge.get("targetHandle", "input"),
            ))

        self.results = {}

        for node_id in order:
            node_def = node_map[node_id]
            node_type = node_def.get("type", "")

            # Look up the node class; skip unknown types gracefully
            node_cls = self.registry.get(node_type)
            if node_cls is None:
                self.results[node_id] = {"_error": f"Unknown node type: {node_type}"}
                continue

            node_instance = node_cls()

            # Gather inputs: start with static data, then overlay connected outputs
            inputs: dict[str, Any] = dict(node_def.get("data", {}))
            for src_id, src_handle, tgt_handle in input_map.get(node_id, []):
                upstream = self.results.get(src_id, {})
                if src_handle in upstream:
                    inputs[tgt_handle] = upstream[src_handle]

            # Validate
            errors = node_instance.validate(inputs)
            if errors:
                self.results[node_id] = {"_errors": errors}
                continue

            # Execute
            try:
                output = node_instance.execute(**inputs)
            except Exception as exc:
                output = {"_error": str(exc)}

            self.results[node_id] = output

        return self.results
]]>