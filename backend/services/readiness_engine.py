from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, List, Sequence

from backend.models.career_models import Continent, Country, StateGraph
from backend.services.unlock_engine import get_unlocked_nodes, is_state_complete


@dataclass(frozen=True)
class StateReadiness:
    state_id: str
    completed: bool
    readiness_percent: float
    next_unlocked_nodes: List[str]


@dataclass(frozen=True)
class RoleReadiness:
    country_id: str
    country_title: str
    readiness_percent: float
    completed_state_count: int
    total_state_count: int
    next_recommended_state: str | None
    state_readiness: List[StateReadiness]


def find_country(continents: Sequence[Continent], country_id: str) -> Country:
    for continent in continents:
        for country in continent.countries:
            if country.id == country_id:
                return country
    raise KeyError(f"Country not found: {country_id}")


def get_readiness_score(
    continents: Sequence[Continent],
    graphs: Dict[str, StateGraph],
    country_id: str,
    progress_by_state: Dict[str, Iterable[str]],
    assessment_scores: Dict[str, float],
) -> RoleReadiness:
    country = find_country(continents, country_id)
    state_readiness: List[StateReadiness] = []
    completed_state_count = 0
    first_incomplete_state: str | None = None

    for state_id in country.states:
        graph = graphs[state_id]
        completed_nodes = set(progress_by_state.get(state_id, []))
        total_nodes = len(graph.nodes)
        node_completion_percent = (len(completed_nodes) / total_nodes) * 100 if total_nodes else 0.0
        assessment_score = assessment_scores.get(state_id, 0.0)
        completed = is_state_complete(graph, completed_nodes, assessment_score)
        if completed:
            completed_state_count += 1
        elif first_incomplete_state is None:
            first_incomplete_state = state_id

        state_readiness.append(
            StateReadiness(
                state_id=state_id,
                completed=completed,
                readiness_percent=round(min((node_completion_percent * 0.7) + (assessment_score * 0.3), 100.0), 2),
                next_unlocked_nodes=get_unlocked_nodes(graph, completed_nodes),
            )
        )

    readiness_percent = round((completed_state_count / len(country.states)) * 100, 2) if country.states else 0.0

    return RoleReadiness(
        country_id=country.id,
        country_title=country.title,
        readiness_percent=readiness_percent,
        completed_state_count=completed_state_count,
        total_state_count=len(country.states),
        next_recommended_state=first_incomplete_state,
        state_readiness=state_readiness,
    )
