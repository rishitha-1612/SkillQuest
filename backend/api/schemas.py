from __future__ import annotations

from typing import Dict, List

from pydantic import BaseModel, Field


class UnlockRequest(BaseModel):
    completed_nodes: List[str] = Field(default_factory=list)


class ReadinessRequest(BaseModel):
    progress_by_state: Dict[str, List[str]] = Field(default_factory=dict)
    assessment_scores: Dict[str, float] = Field(default_factory=dict)


class TutorChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    text: str = Field(min_length=1, max_length=4000)


class TutorChatRequest(BaseModel):
    role_id: str | None = None
    state_id: str | None = None
    message: str = Field(min_length=1, max_length=4000)
    history: List[TutorChatMessage] = Field(default_factory=list)
    player_level: int = 1
    recent_mistakes: List[str] = Field(default_factory=list)


class ProgressionRequest(BaseModel):
    completed_nodes: List[str] = Field(default_factory=list)
    completed_city: str
    score: int = Field(ge=0, le=100)
    player_level: int = Field(default=1, ge=1)
    player_xp: int = Field(default=0, ge=0)
