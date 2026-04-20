from __future__ import annotations

from dataclasses import dataclass, field
from typing import List


@dataclass(frozen=True)
class QuestionRef:
    difficulty: str
    count: int


@dataclass(frozen=True)
class CityNode:
    id: str
    title: str
    type: str
    description: str
    estimated_time_minutes: int
    xp_reward: int
    question_refs: QuestionRef


@dataclass(frozen=True)
class StateGraph:
    state_id: str
    title: str
    entry_nodes: List[str]
    final_assessment_node: str
    nodes: List[CityNode]
    edges: List[List[str]]


@dataclass(frozen=True)
class Country:
    id: str
    title: str
    states: List[str]


@dataclass(frozen=True)
class Continent:
    id: str
    title: str
    focus: str
    countries: List[Country] = field(default_factory=list)


@dataclass(frozen=True)
class StateRequirement:
    state_id: str
    priority: str
    expected_level: str
    why_it_matters: str


@dataclass(frozen=True)
class RoleDag:
    entry_states: List[str]
    final_state: str
    edges: List[List[str]]


@dataclass(frozen=True)
class RoleBlueprint:
    role_id: str
    title: str
    continent_id: str
    summary: str
    responsibilities: List[str]
    core_tools: List[str]
    state_requirements: List[StateRequirement]
    role_dag: RoleDag
