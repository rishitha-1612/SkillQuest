from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Set


@dataclass(frozen=True)
class GraphSnapshot:
    state_id: str
    node_ids: Set[str]
    adjacency: Dict[str, List[str]]
    prerequisites: Dict[str, Set[str]]
