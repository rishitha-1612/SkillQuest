from __future__ import annotations

import json

from fastapi.testclient import TestClient

from backend.main import app


def main() -> None:
    client = TestClient(app)

    responses = {
        "health": client.get("/career-globe/health").json(),
        "world_map_counts": {
            continent["title"]: continent["country_count"]
            for continent in client.get("/career-globe/world-map").json()["continents"]
        },
        "role": client.get("/career-globe/roles/ai_engineer").json()["title"],
        "state": client.get("/career-globe/states/machine_learning").json()["title"],
        "unlock": client.post(
            "/career-globe/states/machine_learning/unlock",
            json={"completed_nodes": ["data_preprocessing", "feature_engineering"]},
        ).json()["unlocked_nodes"],
        "questions_count": len(
            client.get("/career-globe/states/machine_learning/nodes/model_evaluation/questions").json()["questions"]
        ),
        "readiness": client.post(
            "/career-globe/readiness/data_scientist",
            json={
                "progress_by_state": {
                    "python_programming": [
                        "python_basics",
                        "data_structures",
                        "functions_modules",
                        "oop_files",
                        "testing_debugging",
                        "python_capstone",
                    ],
                    "machine_learning": ["data_preprocessing", "feature_engineering"],
                },
                "assessment_scores": {
                    "python_programming": 82,
                    "machine_learning": 48,
                },
            },
        ).json()["country_title"],
    }

    print(json.dumps(responses, indent=2))


if __name__ == "__main__":
    main()
