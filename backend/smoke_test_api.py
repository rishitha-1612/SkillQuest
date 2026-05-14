from __future__ import annotations

import json
from uuid import uuid4

from fastapi.testclient import TestClient

from backend.main import app


def main() -> None:
    client = TestClient(app)
    auth_suffix = uuid4().hex[:8]
    unauth_world_map = client.get("/career-globe/world-map")
    signup_payload = {
        "full_name": "Smoke Test User",
        "username": f"smoke_{auth_suffix}",
        "email": f"smoke_{auth_suffix}@example.com",
        "password": "skillquest123",
    }
    signup_response = client.post("/career-globe/auth/signup", json=signup_payload)
    signup_json = signup_response.json()
    login_response = client.post(
        "/career-globe/auth/login",
        json={"login": signup_payload["email"], "password": signup_payload["password"]},
    )
    login_json = login_response.json()
    me_response = client.get("/career-globe/auth/me")
    logout_response = client.post("/career-globe/auth/logout")
    post_logout_me = client.get("/career-globe/auth/me")
    relogin_response = client.post(
        "/career-globe/auth/login",
        json={"login": signup_payload["username"], "password": signup_payload["password"]},
    )

    responses = {
        "health": client.get("/career-globe/health").json(),
        "auth": {
            "unauth_world_map_status": unauth_world_map.status_code,
            "signup_status": signup_response.status_code,
            "login_status": login_response.status_code,
            "me_username": me_response.json()["user"]["username"],
            "logout_status": logout_response.status_code,
            "post_logout_me_status": post_logout_me.status_code,
            "relogin_status": relogin_response.status_code,
            "token_present": bool(signup_json["token"]),
        },
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
