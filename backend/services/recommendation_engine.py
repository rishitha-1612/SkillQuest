from __future__ import annotations

from collections import deque
from typing import Iterable, List

from backend.models.career_models import StateGraph
from backend.services.unlock_engine import build_graph_snapshot


def get_recommended_path(graph: StateGraph) -> List[str]:
    snapshot = build_graph_snapshot(graph)
    indegree = {node_id: len(snapshot.prerequisites[node_id]) for node_id in snapshot.node_ids}
    queue = deque(sorted(node_id for node_id, degree in indegree.items() if degree == 0))
    ordered: List[str] = []

    while queue:
        node_id = queue.popleft()
        ordered.append(node_id)
        for neighbor in sorted(snapshot.adjacency.get(node_id, [])):
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0:
                queue.append(neighbor)

    if len(ordered) != len(snapshot.node_ids):
        raise ValueError(f"Could not build a topological path for {graph.state_id}.")

    return ordered


def get_next_recommended_nodes(graph: StateGraph, completed_nodes: Iterable[str]) -> List[str]:
    completed = set(completed_nodes)
    return [node_id for node_id in get_recommended_path(graph) if node_id not in completed]
