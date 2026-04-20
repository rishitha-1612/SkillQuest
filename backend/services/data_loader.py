from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List

from backend.models.career_models import (
    CityNode,
    Continent,
    Country,
    QuestionRef,
    RoleBlueprint,
    RoleDag,
    StateGraph,
    StateRequirement,
)


BACKEND_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BACKEND_DIR / "data"


def load_world_map(path: Path | None = None) -> List[Continent]:
    world_map_path = path or DATA_DIR / "world_map.json"
    raw = json.loads(world_map_path.read_text(encoding="utf-8"))
    continents: List[Continent] = []

    for continent in raw["continents"]:
        countries = [
            Country(id=country["id"], title=country["title"], states=country["states"])
            for country in continent["countries"]
        ]
        continents.append(
            Continent(
                id=continent["id"],
                title=continent["title"],
                focus=continent["focus"],
                countries=countries,
            )
        )
    return continents


def load_state_graphs(path: Path | None = None) -> Dict[str, StateGraph]:
    state_graphs_path = path or DATA_DIR / "state_graphs.json"
    raw = json.loads(state_graphs_path.read_text(encoding="utf-8"))
    graphs: Dict[str, StateGraph] = {}

    for graph in raw["state_graphs"]:
        nodes = [
            CityNode(
                id=node["id"],
                title=node["title"],
                type=node["type"],
                description=node["description"],
                estimated_time_minutes=node["estimated_time_minutes"],
                xp_reward=node["xp_reward"],
                question_refs=QuestionRef(
                    difficulty=node["question_refs"]["difficulty"],
                    count=node["question_refs"]["count"],
                ),
            )
            for node in graph["nodes"]
        ]
        graphs[graph["state_id"]] = StateGraph(
            state_id=graph["state_id"],
            title=graph["title"],
            entry_nodes=graph["entry_nodes"],
            final_assessment_node=graph["final_assessment_node"],
            nodes=nodes,
            edges=graph["edges"],
        )

    return graphs


def load_role_blueprints(path: Path | None = None) -> Dict[str, RoleBlueprint]:
    role_blueprints_path = path or DATA_DIR / "role_blueprints.json"
    raw = json.loads(role_blueprints_path.read_text(encoding="utf-8"))
    blueprints: Dict[str, RoleBlueprint] = {}

    for role in raw["role_blueprints"]:
        blueprints[role["role_id"]] = RoleBlueprint(
            role_id=role["role_id"],
            title=role["title"],
            continent_id=role["continent_id"],
            summary=role["summary"],
            responsibilities=role["responsibilities"],
            core_tools=role["core_tools"],
            state_requirements=[
                StateRequirement(
                    state_id=requirement["state_id"],
                    priority=requirement["priority"],
                    expected_level=requirement["expected_level"],
                    why_it_matters=requirement["why_it_matters"],
                )
                for requirement in role["state_requirements"]
            ],
            role_dag=RoleDag(
                entry_states=role["role_dag"]["entry_states"],
                final_state=role["role_dag"]["final_state"],
                edges=role["role_dag"]["edges"],
            ),
        )

    return blueprints
