from __future__ import annotations

from typing import Dict, List

from pydantic import BaseModel, Field


class UnlockRequest(BaseModel):
    completed_nodes: List[str] = Field(default_factory=list)


class ReadinessRequest(BaseModel):
    progress_by_state: Dict[str, List[str]] = Field(default_factory=dict)
    assessment_scores: Dict[str, float] = Field(default_factory=dict)
