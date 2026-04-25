from __future__ import annotations

import os
from typing import Iterable, Sequence

import httpx

from backend.models.career_models import RoleBlueprint, StateGraph


OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"


def _bullet(items: Iterable[str]) -> str:
    return "\n".join(f"- {item}" for item in items)


def _build_skill_context(state: StateGraph | None) -> str:
    if state is None:
        return "No active skill was provided."

    node_lines = [
        f"{index + 1}. {node.title} ({node.type}) - {node.description}"
        for index, node in enumerate(state.nodes)
    ]
    return (
        f"Active skill state: {state.title}\n"
        f"Learning cities / roadmap:\n{_bullet(node_lines)}\n"
        f"Entry city: {', '.join(state.entry_nodes)}\n"
        f"Final assessment city: {state.final_assessment_node}"
    )


def _build_role_context(role: RoleBlueprint | None) -> str:
    if role is None:
        return "No active job role was provided."

    state_lines = [
        f"{index + 1}. {requirement.state_id} | priority={requirement.priority} | expected={requirement.expected_level} | why={requirement.why_it_matters}"
        for index, requirement in enumerate(role.state_requirements)
    ]
    return (
        f"Active job country: {role.title}\n"
        f"Summary: {role.summary}\n"
        f"Responsibilities:\n{_bullet(role.responsibilities)}\n"
        f"Core tools:\n{_bullet(role.core_tools)}\n"
        f"Required skill states:\n{_bullet(state_lines)}"
    )


def _build_system_prompt(role: RoleBlueprint | None, state: StateGraph | None) -> str:
    return (
        "You are the SkillQuest Tutor, a friendly gaming-platform mentor.\n"
        "You help learners understand the active job path and skill state in simple language.\n"
        "Rules:\n"
        "- Answer only about the provided role, skill, roadmap, assessment prep, or project flow.\n"
        "- Teach clearly and warmly.\n"
        "- Always simplify hard ideas before using jargon.\n"
        "- Include one analogy whenever it helps.\n"
        "- When relevant, suggest a short next step the learner can take.\n"
        "- Prefer concise paragraphs and small lists.\n"
        "- If the learner asks something outside the provided scope, say so and steer back to the active roadmap.\n\n"
        f"{_build_role_context(role)}\n\n"
        f"{_build_skill_context(state)}"
    )


def _build_player_context(player_level: int, recent_mistakes: Sequence[str]) -> str:
    if not recent_mistakes:
        return f"Player level: {player_level}\nRecent mistakes: none recorded."
    return (
        f"Player level: {player_level}\n"
        "Recent mistakes:\n"
        + _bullet(recent_mistakes[:5])
    )


def _fallback_reply(message: str, role: RoleBlueprint | None, state: StateGraph | None) -> str:
    role_name = role.title if role else "this job path"
    skill_name = state.title if state else "this skill"
    first_node = state.nodes[0].title if state and state.nodes else "the first city"
    second_node = state.nodes[1].title if state and len(state.nodes) > 1 else "the next city"

    return (
        f"{skill_name} is one important part of becoming a {role_name}. "
        f"Start by getting comfortable with {first_node}, then move into {second_node} so the roadmap stays logical.\n\n"
        f"Analogy: Think of {skill_name} like one province in a game world. "
        "You do not need to conquer the whole map at once, only the next meaningful zone.\n\n"
        f"Your question was: {message}\n"
        "The local open-source model is unavailable right now, so I am giving you a grounded fallback reply from the current roadmap context."
    )


def _generate_gemini_reply(
    *,
    message: str,
    history: Sequence[dict[str, str]],
    role: RoleBlueprint | None,
    state: StateGraph | None,
    player_level: int,
    recent_mistakes: Sequence[str],
) -> str | None:
    if not GEMINI_API_KEY:
        return None

    contents = []
    for item in history[-6:]:
        contents.append(
            {
                "role": "model" if item["role"] == "assistant" else "user",
                "parts": [{"text": item["text"]}],
            }
        )
    contents.append({"role": "user", "parts": [{"text": message}]})

    payload = {
        "system_instruction": {
            "parts": [{"text": f"{_build_system_prompt(role, state)}\n\n{_build_player_context(player_level, recent_mistakes)}"}],
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.3,
        },
    }

    with httpx.Client(timeout=45.0) as client:
        response = client.post(
            f"{GEMINI_BASE_URL}/models/{GEMINI_MODEL}:generateContent",
            headers={
                "x-goog-api-key": GEMINI_API_KEY,
                "Content-Type": "application/json",
            },
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
        candidates = data.get("candidates") or []
        for candidate in candidates:
            parts = candidate.get("content", {}).get("parts") or []
            text = "".join(part.get("text", "") for part in parts if part.get("text")).strip()
            if text:
                return text
    return None


def generate_tutor_reply(
    *,
    message: str,
    history: Sequence[dict[str, str]],
    role: RoleBlueprint | None,
    state: StateGraph | None,
    player_level: int = 1,
    recent_mistakes: Sequence[str] = (),
) -> tuple[str, str]:
    system_prompt = f"{_build_system_prompt(role, state)}\n\n{_build_player_context(player_level, recent_mistakes)}"

    try:
        text = _generate_gemini_reply(
            message=message,
            history=history,
            role=role,
            state=state,
            player_level=player_level,
            recent_mistakes=recent_mistakes,
        )
        if text:
            return text, "gemini"
    except Exception:
        pass

    try:
        chat_messages = [{"role": "system", "content": system_prompt}]
        for item in history[-6:]:
            chat_messages.append({"role": item["role"], "content": item["text"]})
        chat_messages.append({"role": "user", "content": message})
        with httpx.Client(timeout=45.0) as client:
            response = client.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": OLLAMA_MODEL,
                    "stream": False,
                    "messages": chat_messages,
                    "options": {
                        "temperature": 0.3,
                    },
                },
            )
            response.raise_for_status()
            payload = response.json()
            text = payload.get("message", {}).get("content", "").strip()
            if text:
                return text, "ollama"
    except Exception:
        pass

    return _fallback_reply(message, role, state), "fallback"
