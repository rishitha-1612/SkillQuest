from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List


ROOT_DIR = Path(__file__).resolve().parents[2]
QUESTION_BANK_PATH = ROOT_DIR / "data" / "question_bank.json"


def load_question_bank(path: Path | None = None) -> Dict[str, object]:
    question_bank_path = path or QUESTION_BANK_PATH
    return json.loads(question_bank_path.read_text(encoding="utf-8"))


def get_skill_questions_by_difficulty(skill_id: str, difficulty: str) -> List[Dict[str, object]]:
    question_bank = load_question_bank()
    for cluster in question_bank["skill_clusters"]:
        if cluster["id"] == skill_id:
            return cluster["questions_by_difficulty"][difficulty]
    raise KeyError(f"Skill cluster not found in question bank: {skill_id}")


def get_question_slice(skill_id: str, difficulty: str, count: int) -> List[Dict[str, object]]:
    questions = get_skill_questions_by_difficulty(skill_id, difficulty)
    return questions[:count]
