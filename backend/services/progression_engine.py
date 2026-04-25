from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Dict, List

from backend.models.career_models import StateGraph


DIFFICULTY_MULTIPLIER = {
    "lesson": 1.0,
    "interactive_game": 1.4,
    "quiz": 1.8,
    "challenge": 2.2,
}


@dataclass(frozen=True)
class ProgressionResult:
    completed_city: str
    xp_gained: int
    unlocked_nodes: List[str]
    boss_unlocked: bool
    level_progression: Dict[str, int]


def get_xp_gain(node_type: str, score: int) -> int:
    multiplier = DIFFICULTY_MULTIPLIER.get(node_type, 1.0)
    normalized = max(0.4, min(1.0, score / 100))
    return int(round(30 * multiplier * normalized))


def update_progression(
    *,
    graph: StateGraph,
    completed_nodes: List[str],
    completed_city: str,
    score: int,
    player_level: int,
    player_xp: int,
) -> ProgressionResult:
    node_by_id = {node.id: node for node in graph.nodes}
    node = node_by_id[completed_city]
    xp_gained = get_xp_gain(node.type, score)

    next_completed = list(dict.fromkeys([*completed_nodes, completed_city]))
    completed_set = set(next_completed)
    unlocked = []
    for source, target in graph.edges:
        if source in completed_set and target not in completed_set:
            unlocked.append(target)

    boss_unlocked = all(item.id in completed_set for item in graph.nodes[:-1]) if graph.nodes else False
    next_xp = player_xp + xp_gained
    next_level = max(1, (next_xp // 120) + 1)

    return ProgressionResult(
        completed_city=completed_city,
        xp_gained=xp_gained,
        unlocked_nodes=sorted(set(unlocked)),
        boss_unlocked=boss_unlocked,
        level_progression={
            "before_level": player_level,
            "after_level": next_level,
            "before_xp": player_xp,
            "after_xp": next_xp,
        },
    )


def serialize_progression_result(result: ProgressionResult) -> Dict[str, object]:
    return asdict(result)
