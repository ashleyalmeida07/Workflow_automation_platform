"""
graph_builder.py – walks a React-Flow workflow_json manually.

Algorithm (simple & readable):
  1. Build a lookup: node_id -> node dict
  2. Build an adjacency list: source_id -> [target_id, ...]
  3. Find the start node (type "input" OR no incoming edges)
  4. Walk node-by-node in order, running each node function
  5. Merge each node's output into a shared state dict
  6. Return a structured result with per-node logs
"""

from typing import Any
from app.engine.nodes import NODE_RUNNERS


def _node_type(node: dict) -> str:
    """Map the React-Flow node type to our internal engine type."""
    rf_type  = node.get("type", "default")
    label    = node.get("data", {}).get("label", "").lower()
    settings = node.get("data", {}).get("settings", {})

    # Explicit engine type set by the frontend takes priority
    engine_type = node.get("data", {}).get("engine_type", "")
    if engine_type:
        return engine_type

    # Fall back to heuristics based on React-Flow type
    if rf_type == "input":
        return "trigger"
    if rf_type == "output":
        return "end"

    # For 'default' nodes, look at the label
    if "http" in label or "request" in label:
        return "http_request"
    if "condition" in label or "filter" in label:
        return "condition"
    if "action" in label or "step" in label:
        return "action"

    return "action"  # safe default


def run_workflow(workflow_json: dict) -> dict:
    """
    Execute a workflow and return a result dict:
      {
        "status": "completed" | "failed",
        "state":  { ... accumulated outputs ... },
        "steps":  [ { "node_id", "type", "label", "output", "error" }, ... ],
        "error":  "..." (only present on failure)
      }
    """
    nodes = workflow_json.get("nodes", [])
    edges = workflow_json.get("edges", [])

    if not nodes:
        return {
            "status": "failed",
            "state":  {},
            "steps":  [],
            "error":  "Workflow is empty — add at least one node before running.",
        }

    # ── Step 1: build fast lookups ────────────────────────────────────────
    nodes_by_id: dict[str, dict] = {n["id"]: n for n in nodes}

    # adjacency list: which nodes does each node point to?
    next_nodes: dict[str, list[str]] = {n["id"]: [] for n in nodes}
    incoming:   dict[str, int]       = {n["id"]: 0  for n in nodes}

    for edge in edges:
        src = edge.get("source")
        tgt = edge.get("target")
        if src and tgt and src in next_nodes and tgt in incoming:
            next_nodes[src].append(tgt)
            incoming[tgt] = incoming.get(tgt, 0) + 1

    # ── Step 2: multi-strategy start-node detection ───────────────────────
    # Nodes with these engine types are always valid entry points.
    TRIGGER_TYPES = {"trigger", "webhook_trigger", "cron_scheduler"}

    def engine_type_of(n: dict) -> str:
        return n.get("data", {}).get("engine_type", "") or ""

    # Strategy 1: zero-in-degree trigger/webhook/cron nodes (best case)
    queue = [
        n["id"] for n in nodes
        if incoming.get(n["id"], 0) == 0
        and engine_type_of(n) in TRIGGER_TYPES
    ]

    # Strategy 2: any trigger-type node (ignores incoming edges —
    #             handles the case where someone wired something *into* a
    #             trigger by accident, or it sits inside a loop)
    if not queue:
        queue = [n["id"] for n in nodes if engine_type_of(n) in TRIGGER_TYPES]

    # Strategy 3: any zero-in-degree node (handles non-trigger start nodes,
    #             e.g. someone starts with an HTTP Request or Action directly)
    if not queue:
        queue = [nid for nid, count in incoming.items() if count == 0]

    # Strategy 4: last resort — if everything is inside a cycle,
    #             just start with the first node rather than hard-failing
    if not queue:
        queue = [nodes[0]["id"]]


    # ── Step 3: walk the graph (simple BFS) ──────────────────────────────
    state: dict[str, Any] = {}   # shared output accumulator
    steps: list[dict]     = []   # per-node log

    visited: set[str] = set()

    while queue:
        node_id = queue.pop(0)

        if node_id in visited:
            continue
        visited.add(node_id)

        node      = nodes_by_id[node_id]
        node_type = _node_type(node)
        label     = node.get("data", {}).get("label", node_id)
        runner    = NODE_RUNNERS.get(node_type)

        step = {"node_id": node_id, "type": node_type, "label": label, "output": {}, "error": None}

        if runner is None:
            step["error"] = f"Unknown node type: '{node_type}'"
            steps.append(step)
            # Still continue to next nodes
        else:
            try:
                output = runner(node, state)
                state.update(output)
                step["output"] = output
            except Exception as exc:
                step["error"] = str(exc)
                steps.append(step)
                # Stop execution on error
                return {
                    "status": "failed",
                    "state":  state,
                    "steps":  steps,
                    "error":  f"Node '{label}' failed: {exc}",
                }

        steps.append(step)

        # Enqueue children
        for child_id in next_nodes.get(node_id, []):
            if child_id not in visited:
                queue.append(child_id)

    return {
        "status": "completed",
        "state":  state,
        "steps":  steps,
    }


# ── Kept for backward compatibility ──────────────────────────────────────
def build_graph(workflow_json: dict) -> dict:
    return run_workflow(workflow_json)
