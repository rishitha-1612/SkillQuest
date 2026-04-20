from __future__ import annotations

from collections import defaultdict, deque
from typing import Dict, List, Set

from backend.models.career_models import RoleBlueprint, StateGraph


def validate_role_blueprint(role: RoleBlueprint, graphs: Dict[str, StateGraph]) -> None:
    state_ids: Set[str] = {requirement.state_id for requirement in role.state_requirements}

    for state_id in state_ids:
        if state_id not in graphs:
            raise ValueError(f"Role {role.role_id} references an unknown state: {state_id}")

    for state_id in role.role_dag.entry_states:
        if state_id not in state_ids:
            raise ValueError(f"Role {role.role_id} has an invalid entry state: {state_id}")

    if role.role_dag.final_state not in state_ids:
        raise ValueError(f"Role {role.role_id} has an invalid final state: {role.role_dag.final_state}")

    indegree = {state_id: 0 for state_id in state_ids}
    adjacency: Dict[str, List[str]] = defaultdict(list)

    for source, target in role.role_dag.edges:
        if source not in state_ids or target not in state_ids:
            raise ValueError(f"Role {role.role_id} has an invalid DAG edge: {source} -> {target}")
        adjacency[source].append(target)
        indegree[target] += 1

    queue = deque(sorted(state_id for state_id, degree in indegree.items() if degree == 0))
    visited: List[str] = []

    while queue:
        state_id = queue.popleft()
        visited.append(state_id)
        for neighbor in sorted(adjacency.get(state_id, [])):
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0:
                queue.append(neighbor)

    if len(visited) != len(state_ids):
        raise ValueError(f"Role DAG for {role.role_id} is not acyclic.")


def get_role_state_path(role: RoleBlueprint) -> List[str]:
    state_ids: Set[str] = {requirement.state_id for requirement in role.state_requirements}
    indegree = {state_id: 0 for state_id in state_ids}
    adjacency: Dict[str, List[str]] = defaultdict(list)

    for source, target in role.role_dag.edges:
        adjacency[source].append(target)
        indegree[target] += 1

    queue = deque(sorted(state_id for state_id, degree in indegree.items() if degree == 0))
    ordered: List[str] = []

    while queue:
        state_id = queue.popleft()
        ordered.append(state_id)
        for neighbor in sorted(adjacency.get(state_id, [])):
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0:
                queue.append(neighbor)

    if len(ordered) != len(state_ids):
        raise ValueError(f"Could not build a role path for {role.role_id}.")

    return ordered
