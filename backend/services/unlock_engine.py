from __future__ import annotations

from collections import defaultdict, deque
from typing import Dict, Iterable, List, Set

from backend.models.career_models import StateGraph
from backend.models.graph_models import GraphSnapshot


def build_graph_snapshot(graph: StateGraph) -> GraphSnapshot:
    node_ids = {node.id for node in graph.nodes}
    adjacency: Dict[str, List[str]] = defaultdict(list)
    prerequisites: Dict[str, Set[str]] = {node_id: set() for node_id in node_ids}

    for source, target in graph.edges:
        if source not in node_ids or target not in node_ids:
            raise ValueError(f"Invalid edge in {graph.state_id}: {source} -> {target}")
        adjacency[source].append(target)
        prerequisites[target].add(source)

    return GraphSnapshot(
        state_id=graph.state_id,
        node_ids=node_ids,
        adjacency=dict(adjacency),
        prerequisites=prerequisites,
    )


def validate_graph(graph: StateGraph) -> None:
    snapshot = build_graph_snapshot(graph)
    indegree = {node_id: len(snapshot.prerequisites[node_id]) for node_id in snapshot.node_ids}
    queue = deque(sorted(node_id for node_id, degree in indegree.items() if degree == 0))
    visited: List[str] = []

    while queue:
        node_id = queue.popleft()
        visited.append(node_id)
        for neighbor in snapshot.adjacency.get(node_id, []):
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0:
                queue.append(neighbor)

    if len(visited) != len(snapshot.node_ids):
        raise ValueError(f"Graph for {graph.state_id} is not acyclic.")

    missing_entries = [node_id for node_id in graph.entry_nodes if node_id not in snapshot.node_ids]
    if missing_entries:
        raise ValueError(f"Graph for {graph.state_id} has invalid entry nodes: {missing_entries}")

    if graph.final_assessment_node not in snapshot.node_ids:
        raise ValueError(f"Graph for {graph.state_id} has an invalid final assessment node.")


def get_unlocked_nodes(graph: StateGraph, completed_nodes: Iterable[str]) -> List[str]:
    snapshot = build_graph_snapshot(graph)
    completed = set(completed_nodes)
    unlocked: List[str] = []

    for node_id in sorted(snapshot.node_ids):
        if node_id in completed:
            continue
        if snapshot.prerequisites[node_id].issubset(completed):
            unlocked.append(node_id)

    return unlocked


def get_locked_nodes(graph: StateGraph, completed_nodes: Iterable[str]) -> List[str]:
    snapshot = build_graph_snapshot(graph)
    completed = set(completed_nodes)
    return sorted(node_id for node_id in snapshot.node_ids if node_id not in completed and node_id not in get_unlocked_nodes(graph, completed))


def is_state_complete(graph: StateGraph, completed_nodes: Iterable[str], assessment_score: float, passing_score: float = 70.0) -> bool:
    snapshot = build_graph_snapshot(graph)
    completed = set(completed_nodes)
    return snapshot.node_ids.issubset(completed) and assessment_score >= passing_score
