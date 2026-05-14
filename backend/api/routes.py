from __future__ import annotations

from dataclasses import asdict
from functools import lru_cache
import os
from typing import Dict, List

from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, Query, Request, Response, status

from backend.api.schemas import LoginRequest, ProgressionRequest, ReadinessRequest, SignupRequest, TutorChatRequest, UnlockRequest
from backend.models.career_models import RoleBlueprint, StateGraph
from backend.services.data_loader import load_role_blueprints, load_state_graphs, load_world_map
from backend.services.auth_service import (
    LOGIN_RATE_LIMIT,
    LOGIN_RATE_WINDOW_MINUTES,
    SIGNUP_RATE_LIMIT,
    SIGNUP_RATE_WINDOW_MINUTES,
    SESSION_TTL_DAYS,
    AuthUser,
    authenticate_user,
    clear_rate_limit,
    create_session,
    create_user,
    delete_session,
    get_rate_limit_retry_after,
    get_user_by_token,
    register_rate_limit_failure,
)
from backend.services.question_bank_service import get_question_slice
from backend.services.progression_engine import serialize_progression_result, update_progression
from backend.services.readiness_engine import get_readiness_score
from backend.services.recommendation_engine import get_next_recommended_nodes, get_recommended_path
from backend.services.role_path_engine import get_role_state_path
from backend.services.tutor_service import generate_tutor_reply
from backend.services.unlock_engine import build_graph_snapshot, get_locked_nodes, get_unlocked_nodes


router = APIRouter(prefix="/career-globe", tags=["career-globe"])
SESSION_COOKIE_NAME = "skillquest_session"
SESSION_COOKIE_SECURE = os.getenv("SKILLQUEST_COOKIE_SECURE", "false").lower() == "true"


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


def extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    scheme, _, value = authorization.partition(" ")
    if scheme.lower() != "bearer" or not value:
        return None
    return value.strip()


def serialize_auth_user(user) -> Dict[str, object]:
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "created_at": user.created_at,
    }


def get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def set_session_cookie(response: Response, token: str, _expires_at: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=SESSION_COOKIE_SECURE,
        samesite="lax",
        path="/",
        max_age=SESSION_TTL_DAYS * 24 * 60 * 60,
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        httponly=True,
        secure=SESSION_COOKIE_SECURE,
        samesite="lax",
        path="/",
    )


def require_auth_user(
    authorization: str | None = Header(default=None),
    session_cookie: str | None = Cookie(default=None, alias=SESSION_COOKIE_NAME),
) -> AuthUser:
    token = extract_bearer_token(authorization) or session_cookie or ""
    user = get_user_by_token(token)
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required.")
    return user


def enforce_rate_limit(scope: str, rate_key: str) -> None:
    retry_after = get_rate_limit_retry_after(scope=scope, rate_key=rate_key)
    if retry_after <= 0:
        return
    raise HTTPException(
        status_code=429,
        detail=f"Too many attempts. Try again in {retry_after} seconds.",
        headers={"Retry-After": str(retry_after)},
    )


@router.get("/health")
def healthcheck() -> Dict[str, str]:
    return {"status": "ok"}


@router.post("/auth/signup", status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, request: Request, response: Response) -> Dict[str, object]:
    client_ip = get_client_ip(request)
    enforce_rate_limit("signup-ip", client_ip)

    try:
        user = create_user(
            email=payload.email,
            username=payload.username,
            full_name=payload.full_name,
            password=payload.password,
        )
    except ValueError as exc:
        retry_after = register_rate_limit_failure(
            scope="signup-ip",
            rate_key=client_ip,
            limit=SIGNUP_RATE_LIMIT,
            window_minutes=SIGNUP_RATE_WINDOW_MINUTES,
        )
        if retry_after > 0:
            raise HTTPException(
                status_code=429,
                detail=f"Too many signup attempts. Try again in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)},
            ) from exc
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    session = create_session(user)
    clear_rate_limit(scope="signup-ip", rate_key=client_ip)
    set_session_cookie(response, session.token, session.expires_at)
    return {
        "token": session.token,
        "expires_at": session.expires_at,
        "user": serialize_auth_user(session.user),
    }


@router.post("/auth/login")
def login(payload: LoginRequest, request: Request, response: Response) -> Dict[str, object]:
    client_ip = get_client_ip(request)
    normalized_login = payload.login.strip().lower()
    enforce_rate_limit("login-ip", client_ip)
    enforce_rate_limit("login-identifier", normalized_login)

    user = authenticate_user(login=payload.login, password=payload.password)
    if user is None:
        ip_retry_after = register_rate_limit_failure(
            scope="login-ip",
            rate_key=client_ip,
            limit=LOGIN_RATE_LIMIT,
            window_minutes=LOGIN_RATE_WINDOW_MINUTES,
        )
        login_retry_after = register_rate_limit_failure(
            scope="login-identifier",
            rate_key=normalized_login,
            limit=LOGIN_RATE_LIMIT,
            window_minutes=LOGIN_RATE_WINDOW_MINUTES,
        )
        retry_after = max(ip_retry_after, login_retry_after)
        if retry_after > 0:
            raise HTTPException(
                status_code=429,
                detail=f"Too many login attempts. Try again in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)},
            )
        raise HTTPException(status_code=401, detail="Invalid email/username or password.")

    session = create_session(user)
    clear_rate_limit(scope="login-ip", rate_key=client_ip)
    clear_rate_limit(scope="login-identifier", rate_key=normalized_login)
    set_session_cookie(response, session.token, session.expires_at)
    return {
        "token": session.token,
        "expires_at": session.expires_at,
        "user": serialize_auth_user(session.user),
    }


@router.get("/auth/me")
def auth_me(user: AuthUser = Depends(require_auth_user)) -> Dict[str, object]:
    return {"user": serialize_auth_user(user)}


@router.post("/auth/logout")
def logout(
    response: Response,
    authorization: str | None = Header(default=None),
    session_cookie: str | None = Cookie(default=None, alias=SESSION_COOKIE_NAME),
) -> Dict[str, object]:
    token = extract_bearer_token(authorization) or session_cookie
    if token:
        delete_session(token)
    clear_session_cookie(response)
    return {"status": "logged_out"}


@router.get("/world-map")
def world_map(_: AuthUser = Depends(require_auth_user)) -> Dict[str, object]:
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
def list_roles(continent_id: str | None = Query(default=None), _: AuthUser = Depends(require_auth_user)) -> Dict[str, List[Dict[str, object]]]:
    roles = get_role_blueprints().values()
    if continent_id:
        roles = [role for role in roles if role.continent_id == continent_id]
    return {"roles": [serialize_role_blueprint(role) for role in roles]}


@router.get("/roles/{role_id}")
def role_details(role_id: str, _: AuthUser = Depends(require_auth_user)) -> Dict[str, object]:
    roles = get_role_blueprints()
    if role_id not in roles:
        raise HTTPException(status_code=404, detail=f"Unknown role: {role_id}")
    return serialize_role_blueprint(roles[role_id])


@router.get("/states")
def list_states(_: AuthUser = Depends(require_auth_user)) -> Dict[str, List[Dict[str, object]]]:
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
def state_details(state_id: str, _: AuthUser = Depends(require_auth_user)) -> Dict[str, object]:
    graphs = get_state_graphs()
    if state_id not in graphs:
        raise HTTPException(status_code=404, detail=f"Unknown state: {state_id}")
    return serialize_state_graph(graphs[state_id])


@router.get("/states/{state_id}/recommended-path")
def state_recommended_path(state_id: str, _: AuthUser = Depends(require_auth_user)) -> Dict[str, object]:
    graphs = get_state_graphs()
    if state_id not in graphs:
        raise HTTPException(status_code=404, detail=f"Unknown state: {state_id}")
    graph = graphs[state_id]
    return {
        "state_id": state_id,
        "recommended_path": get_recommended_path(graph),
    }


@router.post("/states/{state_id}/unlock")
def state_unlocks(state_id: str, payload: UnlockRequest, _: AuthUser = Depends(require_auth_user)) -> Dict[str, object]:
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
def node_questions(
    state_id: str,
    node_id: str,
    count: int | None = Query(default=None, ge=1, le=25),
    _: AuthUser = Depends(require_auth_user),
) -> Dict[str, object]:
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
def readiness(country_id: str, payload: ReadinessRequest, _: AuthUser = Depends(require_auth_user)) -> Dict[str, object]:
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


@router.post("/tutor/chat")
def tutor_chat(payload: TutorChatRequest, _: AuthUser = Depends(require_auth_user)) -> Dict[str, object]:
    roles = get_role_blueprints()
    graphs = get_state_graphs()

    role = roles.get(payload.role_id) if payload.role_id else None
    state = graphs.get(payload.state_id) if payload.state_id else None

    reply, provider = generate_tutor_reply(
        message=payload.message,
        history=[{"role": item.role, "text": item.text} for item in payload.history],
        role=role,
        state=state,
        player_level=payload.player_level,
        recent_mistakes=payload.recent_mistakes,
    )

    return {
        "reply": reply,
        "provider": provider,
        "model": {
            "gemini": "gemini-free-tier",
            "ollama": "local-open-source",
            "fallback": "fallback",
        }.get(provider, provider),
    }


@router.post("/states/{state_id}/progression")
def state_progression(state_id: str, payload: ProgressionRequest, _: AuthUser = Depends(require_auth_user)) -> Dict[str, object]:
    graphs = get_state_graphs()
    if state_id not in graphs:
        raise HTTPException(status_code=404, detail=f"Unknown state: {state_id}")
    graph = graphs[state_id]
    if payload.completed_city not in {node.id for node in graph.nodes}:
        raise HTTPException(status_code=404, detail=f"Unknown city '{payload.completed_city}' in state '{state_id}'")

    result = update_progression(
        graph=graph,
        completed_nodes=payload.completed_nodes,
        completed_city=payload.completed_city,
        score=payload.score,
        player_level=payload.player_level,
        player_xp=payload.player_xp,
    )
    return {
        "state_id": state_id,
        **serialize_progression_result(result),
    }
