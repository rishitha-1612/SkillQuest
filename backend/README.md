# Career Globe Backend

This folder now contains a working FastAPI backend for the Career Globe side feature inside Skill Quest.

The backend supports a gamified career-learning system where:

- continents represent job clusters
- countries represent job roles
- states represent skill clusters
- cities represent learning nodes inside a DAG

## What We Have Built

### 1. Question Bank Foundation

We created a reusable question-bank pipeline:

- Question generator: [generate_question_bank.py](/C:/Users/admin/Desktop/Skill Quest/scripts/generate_question_bank.py)
- Generated dataset: [question_bank.json](/C:/Users/admin/Desktop/Skill Quest/data/question_bank.json)

Current question-bank scope:

- `10` skill clusters
- `100` questions per skill cluster
- `30 easy`, `40 medium`, `30 hard`
- reusable storage per skill cluster
- `questions_by_difficulty` support for easy lookup

### 2. Learning World Data Layer

We created the backend data structure for the career world:

- World map data: [world_map.json](/C:/Users/admin/Desktop/Skill Quest/backend/data/world_map.json)
- State DAGs: [state_graphs.json](/C:/Users/admin/Desktop/Skill Quest/backend/data/state_graphs.json)
- Detailed role blueprints: [role_blueprints.json](/C:/Users/admin/Desktop/Skill Quest/backend/data/role_blueprints.json)

### 3. Role Expansion

Each cluster now contains `7 job roles`.

#### AI & Data

- AI Engineer
- Machine Learning Engineer
- Data Scientist
- Data Analyst
- AI Researcher
- NLP Engineer
- MLOps Engineer

#### Cloud & Infrastructure

- Cloud Architect
- DevOps Engineer
- Site Reliability Engineer (SRE)
- Cloud Engineer
- Platform Engineer
- Cloud Security Engineer
- Infrastructure Automation Engineer

### 4. Backend Logic Layer

We implemented reusable backend services for:

- state DAG validation
- role DAG validation
- node unlock logic
- topological recommendation logic
- role-level state path ordering
- readiness score calculation
- question slicing per node

Main service files:

- [data_loader.py](/C:/Users/admin/Desktop/Skill Quest/backend/services/data_loader.py)
- [unlock_engine.py](/C:/Users/admin/Desktop/Skill Quest/backend/services/unlock_engine.py)
- [recommendation_engine.py](/C:/Users/admin/Desktop/Skill Quest/backend/services/recommendation_engine.py)
- [readiness_engine.py](/C:/Users/admin/Desktop/Skill Quest/backend/services/readiness_engine.py)
- [role_path_engine.py](/C:/Users/admin/Desktop/Skill Quest/backend/services/role_path_engine.py)
- [question_bank_service.py](/C:/Users/admin/Desktop/Skill Quest/backend/services/question_bank_service.py)

### 5. Working FastAPI Backend

We converted the backend into a working FastAPI app:

- App entry: [main.py](/C:/Users/admin/Desktop/Skill Quest/backend/main.py)
- API router: [routes.py](/C:/Users/admin/Desktop/Skill Quest/backend/api/routes.py)
- Request schemas: [schemas.py](/C:/Users/admin/Desktop/Skill Quest/backend/api/schemas.py)
- Smoke test: [smoke_test_api.py](/C:/Users/admin/Desktop/Skill Quest/backend/smoke_test_api.py)
- Dependencies list: [requirements.txt](/C:/Users/admin/Desktop/Skill Quest/backend/requirements.txt)

The API now exposes:

- health check
- world map
- role list
- role details
- state list
- state details
- recommended state path
- unlock status
- node question slices
- readiness calculation

## Current Backend Structure

```text
backend/
  README.md
  requirements.txt
  main.py
  demo_backend.py
  smoke_test_api.py
  api/
    __init__.py
    routes.py
    schemas.py
  data/
    world_map.json
    state_graphs.json
    role_blueprints.json
  models/
    career_models.py
    graph_models.py
  services/
    data_loader.py
    question_bank_service.py
    unlock_engine.py
    recommendation_engine.py
    readiness_engine.py
    role_path_engine.py
```

## FastAPI Endpoints

Base route prefix:

```text
/career-globe
```

Available endpoints:

- `GET /`
- `GET /career-globe/health`
- `GET /career-globe/world-map`
- `GET /career-globe/roles`
- `GET /career-globe/roles/{role_id}`
- `GET /career-globe/states`
- `GET /career-globe/states/{state_id}`
- `GET /career-globe/states/{state_id}/recommended-path`
- `POST /career-globe/states/{state_id}/unlock`
- `GET /career-globe/states/{state_id}/nodes/{node_id}/questions`
- `POST /career-globe/readiness/{country_id}`

## How To Run The Backend

From the project root:

```bash
uvicorn backend.main:app --reload
```

FastAPI docs will be available at:

- [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

## How To Verify It Works

### 1. Run the demo validator

```bash
python -m backend.demo_backend
```

This validates:

- state DAGs
- role DAGs
- role-path ordering
- unlock logic
- readiness output

### 2. Run the API smoke test

```bash
python -m backend.smoke_test_api
```

This checks:

- FastAPI app boots correctly
- world map is returned
- role endpoint works
- state endpoint works
- unlock endpoint works
- question endpoint works
- readiness endpoint works

## Example API Payloads

### Unlock Request

```json
{
  "completed_nodes": ["data_preprocessing", "feature_engineering"]
}
```

### Readiness Request

```json
{
  "progress_by_state": {
    "python_programming": [
      "python_basics",
      "data_structures"
    ],
    "machine_learning": [
      "data_preprocessing",
      "feature_engineering"
    ]
  },
  "assessment_scores": {
    "python_programming": 75,
    "machine_learning": 48
  }
}
```

## How To Integrate This With The Frontend

The frontend should treat this backend as the source of truth for:

- world map structure
- job role details
- role-level learning path
- state-level DAG nodes and edges
- unlock status
- question slices for nodes
- readiness calculations

### Suggested Frontend Flow

1. Load the world map
   Call `GET /career-globe/world-map`
2. Show role cards or role pages
   Call `GET /career-globe/roles` or `GET /career-globe/roles/{role_id}`
3. Open a skill state graph
   Call `GET /career-globe/states/{state_id}`
4. Calculate what is unlocked
   Call `POST /career-globe/states/{state_id}/unlock`
5. Load questions for a city/node
   Call `GET /career-globe/states/{state_id}/nodes/{node_id}/questions`
6. Show career readiness
   Call `POST /career-globe/readiness/{country_id}`

### Suggested Frontend Mapping

Use these backend resources in the UI:

- `world-map` response for continents and countries
- `roles/{role_id}` for job-role detail pages
- `states/{state_id}` for graph rendering
- `unlock` response for node activation states
- `questions` response for quiz/game/challenge payloads
- `readiness` response for progress bars and next recommendations

### Example Frontend Integration Pattern

- Home map page:
  Use `GET /career-globe/world-map`
- Role detail modal/page:
  Use `GET /career-globe/roles/{role_id}`
- Skill state graph screen:
  Use `GET /career-globe/states/{state_id}`
- After a node is completed:
  Re-call `POST /career-globe/states/{state_id}/unlock`
- Before rendering node questions:
  Call `GET /career-globe/states/{state_id}/nodes/{node_id}/questions`
- Readiness dashboard:
  Call `POST /career-globe/readiness/{country_id}`

## Important Design Decision

We intentionally stored the question bank once per skill cluster instead of repeating the same questions for every job role.

Why this helps:

- less duplicated content
- easier maintenance
- cleaner backend design
- better reuse across roles sharing the same skill clusters

## What Is Still Pending

The backend is working, but these are the next major tasks:

- persist user progress in a database
- store final assessment attempts
- build certificate generation
- generate verification IDs
- support public profile / achievement views
- add authentication and user accounts
- improve node-level question mapping beyond simple difficulty/count slices
- add production config and deployment setup

## What We Plan To Do Next

The best next implementation order is:

1. Add persistent storage
   Save completed nodes, scores, XP, and assessment attempts.
2. Add user model and authentication
   So progress is tied to a learner.
3. Add final assessment workflow
   Complete a state only when all nodes are done and the passing threshold is met.
4. Add certificate generation
   Generate completion proof with verification metadata.
5. Add frontend integration wiring
   Connect the actual app screens to these endpoints.
6. Add deployment readiness
   Environment variables, production settings, and hosting plan.

## Status Summary

Current status:

- Question bank generation is completed
- Question bank storage is completed
- Difficulty segregation is completed
- World map backend data is completed
- State DAG backend data is completed
- Detailed role blueprints are completed
- Role DAG connections are completed
- Unlock engine is completed
- Recommendation engine is completed
- Readiness engine is completed
- FastAPI backend is completed
- API smoke testing is completed
- Database persistence is not built yet
- Certificate system is not built yet
- Authentication is not built yet
