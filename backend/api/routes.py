from __future__ import annotations

from dataclasses import asdict
from functools import lru_cache
from typing import Dict, List

from fastapi import APIRouter, HTTPException, Query

from backend.api.schemas import ReadinessRequest, UnlockRequest
from backend.models.career_models import RoleBlueprint, StateGraph
from backend.services.data_loader import load_role_blueprints, load_state_graphs, load_world_map
from backend.services.question_bank_service import get_question_slice
from backend.services.readiness_engine import get_readiness_score
from backend.services.recommendation_engine import get_next_recommended_nodes, get_recommended_path
from backend.services.role_path_engine import get_role_state_path
from backend.services.unlock_engine import build_graph_snapshot, get_locked_nodes, get_unlocked_nodes


router = APIRouter(prefix="/career-globe", tags=["career-globe"])


@lru_cache(maxsize=1)
def get_continents():
    return load_world_map()


@lru_cache(maxsize=1)
def get_state_graphs() -> Dict[str, StateGraph]:
    return load_state_graphs()


@lru_cache(maxsize=1)
def get_role_blueprints() -> Dict[str, RoleBlueprint]:
    return load_role_blueprints()


def serialize_state_graph(graph: StateGraph) -> Dict[str, object]:
    snapshot = build_graph_snapshot(graph)
    prerequisites = {node_id: sorted(values) for node_id, values in snapshot.prerequisites.items()}
    return {
        "state_id": graph.state_id,
        "title": graph.title,
        "entry_nodes": graph.entry_nodes,
        "final_assessment_node": graph.final_assessment_node,
        "nodes": [asdict(node) for node in graph.nodes],
        "edges": graph.edges,
        "prerequisites": prerequisites,
        "recommended_path": get_recommended_path(graph),
    }


def serialize_role_blueprint(role: RoleBlueprint) -> Dict[str, object]:
    return {
        "role_id": role.role_id,
        "title": role.title,
        "continent_id": role.continent_id,
        "summary": role.summary,
        "responsibilities": role.responsibilities,
        "core_tools": role.core_tools,
        "state_requirements": [asdict(requirement) for requirement in role.state_requirements],
        "role_dag": asdict(role.role_dag),
        "recommended_state_path": get_role_state_path(role),
    }


@router.get("/health")
def healthcheck() -> Dict[str, str]:
    return {"status": "ok"}


@router.get("/world-map")
def world_map() -> Dict[str, object]:
    continents = get_continents()
    return {
        "continents": [
            {
                "id": continent.id,
                "title": continent.title,
                "focus": continent.focus,
                "country_count": len(continent.countries),
                "countries": [asdict(country) for country in continent.countries],
            }
            for continent in continents
        ]
    }


@router.get("/roles")
def list_roles(continent_id: str | None = Query(default=None)) -> Dict[str, List[Dict[str, object]]]:
    roles = get_role_blueprints().values()
    if continent_id:
        roles = [role for role in roles if role.continent_id == continent_id]
    return {"roles": [serialize_role_blueprint(role) for role in roles]}


@router.get("/roles/{role_id}")
def role_details(role_id: str) -> Dict[str, object]:
    roles = get_role_blueprints()
    if role_id not in roles:
        raise HTTPException(status_code=404, detail=f"Unknown role: {role_id}")
    return serialize_role_blueprint(roles[role_id])


@router.get("/states")
def list_states() -> Dict[str, List[Dict[str, object]]]:
    return {
        "states": [
            {
                "state_id": graph.state_id,
                "title": graph.title,
                "entry_nodes": graph.entry_nodes,
                "final_assessment_node": graph.final_assessment_node,
            }
            for graph in get_state_graphs().values()
        ]
    }


@router.get("/states/{state_id}")
def state_details(state_id: str) -> Dict[str, object]:
    graphs = get_state_graphs()
    if state_id not in graphs:
        raise HTTPException(status_code=404, detail=f"Unknown state: {state_id}")
    return serialize_state_graph(graphs[state_id])


@router.get("/states/{state_id}/recommended-path")
def state_recommended_path(state_id: str) -> Dict[str, object]:
    graphs = get_state_graphs()
    if state_id not in graphs:
        raise HTTPException(status_code=404, detail=f"Unknown state: {state_id}")
    graph = graphs[state_id]
    return {
        "state_id": state_id,
        "recommended_path": get_recommended_path(graph),
    }


@router.post("/states/{state_id}/unlock")
def state_unlocks(state_id: str, payload: UnlockRequest) -> Dict[str, object]:
    graphs = get_state_graphs()
    if state_id not in graphs:
        raise HTTPException(status_code=404, detail=f"Unknown state: {state_id}")
    graph = graphs[state_id]
    return {
        "state_id": state_id,
        "completed_nodes": payload.completed_nodes,
        "unlocked_nodes": get_unlocked_nodes(graph, payload.completed_nodes),
        "locked_nodes": get_locked_nodes(graph, payload.completed_nodes),
        "next_recommended_nodes": get_next_recommended_nodes(graph, payload.completed_nodes),
    }


@router.get("/states/{state_id}/nodes/{node_id}/questions")
def node_questions(state_id: str, node_id: str, count: int | None = Query(default=None, ge=1, le=25)) -> Dict[str, object]:
    graphs = get_state_graphs()
    if state_id not in graphs:
        raise HTTPException(status_code=404, detail=f"Unknown state: {state_id}")

    graph = graphs[state_id]
    node = next((node for node in graph.nodes if node.id == node_id), None)
    if node is None:
        raise HTTPException(status_code=404, detail=f"Unknown node '{node_id}' in state '{state_id}'")

    requested_count = count or node.question_refs.count
    questions = get_question_slice(state_id, node.question_refs.difficulty, requested_count)

    return {
        "state_id": state_id,
        "node_id": node_id,
        "difficulty": node.question_refs.difficulty,
        "requested_count": requested_count,
        "questions": questions,
    }


@router.post("/readiness/{country_id}")
def readiness(country_id: str, payload: ReadinessRequest) -> Dict[str, object]:
    try:
        result = get_readiness_score(
            continents=get_continents(),
            graphs=get_state_graphs(),
            country_id=country_id,
            progress_by_state=payload.progress_by_state,
            assessment_scores=payload.assessment_scores,
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return {
        "country_id": result.country_id,
        "country_title": result.country_title,
        "readiness_percent": result.readiness_percent,
        "completed_state_count": result.completed_state_count,
        "total_state_count": result.total_state_count,
        "next_recommended_state": result.next_recommended_state,
        "state_readiness": [asdict(item) for item in result.state_readiness],
    }
