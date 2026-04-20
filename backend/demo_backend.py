from __future__ import annotations

import json

from backend.services.data_loader import load_role_blueprints, load_state_graphs, load_world_map
from backend.services.readiness_engine import get_readiness_score
from backend.services.recommendation_engine import get_next_recommended_nodes, get_recommended_path
from backend.services.role_path_engine import get_role_state_path, validate_role_blueprint
from backend.services.unlock_engine import get_unlocked_nodes, validate_graph


def main() -> None:
    continents = load_world_map()
    graphs = load_state_graphs()
    role_blueprints = load_role_blueprints()

    for graph in graphs.values():
        validate_graph(graph)
    for role in role_blueprints.values():
        validate_role_blueprint(role, graphs)

    machine_learning_graph = graphs["machine_learning"]
    completed_nodes = {"data_preprocessing", "feature_engineering"}

    sample = {
        "cluster_role_counts": {
            continent.title: len(continent.countries) for continent in continents
        },
        "sample_role_state_path": {
            "role_id": "ai_engineer",
            "ordered_states": get_role_state_path(role_blueprints["ai_engineer"]),
        },
        "recommended_path": get_recommended_path(machine_learning_graph),
        "unlocked_nodes": get_unlocked_nodes(machine_learning_graph, completed_nodes),
        "next_recommended_nodes": get_next_recommended_nodes(machine_learning_graph, completed_nodes),
        "role_readiness": get_readiness_score(
            continents=continents,
            graphs=graphs,
            country_id="data_scientist",
            progress_by_state={
                "python_programming": {
                    "python_basics",
                    "data_structures",
                    "functions_modules",
                    "oop_files",
                    "testing_debugging",
                    "python_capstone",
                },
                "mathematics_statistics": {"algebra_foundations", "linear_algebra_probability"},
                "machine_learning": completed_nodes,
                "deep_learning": {"tensor_foundations"},
                "data_visualization": set(),
            },
            assessment_scores={
                "python_programming": 82.0,
                "mathematics_statistics": 55.0,
                "machine_learning": 48.0,
                "deep_learning": 22.0,
                "data_visualization": 0.0,
            },
        ).__dict__,
    }

    print(json.dumps(sample, indent=2, default=lambda value: value.__dict__))


if __name__ == "__main__":
    main()
