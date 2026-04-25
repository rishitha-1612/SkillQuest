# SkillQuest AI

SkillQuest AI is a gamified career-learning platform prototype where:

- continents are job clusters
- countries are jobs
- states are the professional skills required for that job
- cities inside each state are the step-by-step learning trajectory
- the end of each state contains an assessment gate before the next state unlocks

The current project is a React + Vite frontend with a FastAPI backend, a rotating Earth lobby, country-specific skill windows, local map assets, professional role roadmaps, a rider journey system, a subject-based assessment engine, and a tutor chat that can use a local open-source LLM.

## Resume Here

If this project is opened in a fresh chat, this is the fastest way to regain context:

1. Read this README first.
2. Check [frontend/src/App.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/App.jsx) to understand the multi-window flow.
3. Check [frontend/src/components/CountryWindow.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/CountryWindow.jsx) to understand the main gameplay screen.
4. Check [backend/data/role_blueprints.json](C:/Users/admin/Desktop/SkillQuest-Ai/backend/data/role_blueprints.json) and [backend/data/state_graphs.json](C:/Users/admin/Desktop/SkillQuest-Ai/backend/data/state_graphs.json) for the actual learning roadmap.
5. Check [frontend/src/data/assessmentQuestionBank.js](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/data/assessmentQuestionBank.js) for the current assessment content.
6. Check [backend/services/tutor_service.py](C:/Users/admin/Desktop/SkillQuest-Ai/backend/services/tutor_service.py) and [frontend/src/components/TutorChatPanel.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/TutorChatPanel.jsx) for the current tutor chat flow.

## Current Product Shape

### World Lobby

The main world screen is a rotating Earth:

- job labels are pinned to countries
- labels move with the rotating globe
- clicking a country opens a separate country window
- the world is meant to feel like a playable realm map, not a dashboard

Main files:

- [frontend/src/App.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/App.jsx)
- [frontend/src/components/WorldMap.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/WorldMap.jsx)
- [frontend/src/data/worldConfig.js](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/data/worldConfig.js)

### Country Window

Each country is the playable learning area for one job:

- left side shows the country map
- right side shows mission board, rider journey, skill route, and tutor chat
- each state is a professional skill for the role
- each city is a learning node inside that skill
- passing the state assessment unlocks the next state

Main file:

- [frontend/src/components/CountryWindow.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/CountryWindow.jsx)

### Assessments

Each skill state ends with an assessment:

- each skill has a `100`-question bank
- each attempt draws `30` questions
- current live split is:
  - `7` easy
  - `15` medium
  - `8` hard
- pass mark is `75%`
- assessments open in a separate window
- tutor chat is locked while an assessment is open
- tab switching fails the attempt

Main files:

- [frontend/src/components/AssessmentRouteWindow.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/AssessmentRouteWindow.jsx)
- [frontend/src/components/AssessmentWindow.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/AssessmentWindow.jsx)
- [frontend/src/data/assessmentGenerator.js](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/data/assessmentGenerator.js)
- [frontend/src/data/assessmentQuestionBank.js](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/data/assessmentQuestionBank.js)
- [frontend/src/data/assessmentLock.js](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/data/assessmentLock.js)

### Tutor Chat

The tutor is now structured to work as a real learning assistant:

- frontend sends the active role, state, chat history, and user message
- backend builds grounded context from the active job and skill roadmap
- backend tries Gemini free tier first when `GEMINI_API_KEY` or `GOOGLE_API_KEY` is set
- backend falls back to a local Ollama model if Gemini is not configured
- if the local model is unavailable, the backend falls back to a grounded roadmap reply instead of crashing
- tutor is meant to explain concepts simply, guide next steps, and use analogies

Main files:

- [frontend/src/components/TutorChatPanel.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/TutorChatPanel.jsx)
- [frontend/src/api/client.js](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/api/client.js)
- [backend/services/tutor_service.py](C:/Users/admin/Desktop/SkillQuest-Ai/backend/services/tutor_service.py)
- [backend/api/routes.py](C:/Users/admin/Desktop/SkillQuest-Ai/backend/api/routes.py)
- [backend/api/schemas.py](C:/Users/admin/Desktop/SkillQuest-Ai/backend/api/schemas.py)

### Maps and Visual Worlds

- India has a custom special world
- Korea has its own custom path and should be treated carefully
- generic countries use local cached boundary files and 3D-style shared rendering
- maps are local to avoid runtime download failures

Main files:

- [frontend/src/components/India3DMap.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/India3DMap.jsx)
- [frontend/src/components/Korea3DMap.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/Korea3DMap.jsx)
- [frontend/src/components/CountryMap3D.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/CountryMap3D.jsx)
- [frontend/public/maps](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/public/maps)

## Current Job Countries

The active jobs currently mapped as countries are:

- AI Engineer
- ML Engineer
- Data Scientist
- Data Engineer
- Prompt Engineer
- Cloud Architect
- Cybersecurity Specialist
- Software Developer
- Full Stack Engineer
- Blockchain Developer

Current country assignment:

- Russia -> Cloud Architect
- Canada -> Full Stack Engineer
- China -> Cybersecurity Specialist
- United States -> Data Engineer
- South Korea -> ML Engineer
- India -> AI Engineer
- Australia -> Data Scientist
- Kazakhstan -> Blockchain Developer
- Saudi Arabia -> Prompt Engineer
- South Africa -> Software Developer

## Roadmap Data Model

### Role Blueprints

Each job now has a broader professional roadmap instead of a basic 5-skill version.

Each role blueprint contains:

- title
- summary
- responsibilities
- tools
- state requirements
- importance level
- expected proficiency
- role DAG for progression

File:

- [backend/data/role_blueprints.json](C:/Users/admin/Desktop/SkillQuest-Ai/backend/data/role_blueprints.json)

### State Graphs

Each state graph contains:

- the state title
- entry city
- final assessment city
- city nodes inside the skill
- edges between cities

This is the detailed learning trajectory inside a single professional skill.

File:

- [backend/data/state_graphs.json](C:/Users/admin/Desktop/SkillQuest-Ai/backend/data/state_graphs.json)

### World Map Data

This ties jobs to continents and country-level state lists.

File:

- [backend/data/world_map.json](C:/Users/admin/Desktop/SkillQuest-Ai/backend/data/world_map.json)

## File Guide

### Backend

- [backend/main.py](C:/Users/admin/Desktop/SkillQuest-Ai/backend/main.py)
  - FastAPI app startup and CORS wiring
- [backend/api/routes.py](C:/Users/admin/Desktop/SkillQuest-Ai/backend/api/routes.py)
  - all main API routes for world map, roles, states, readiness, questions, and tutor chat
- [backend/api/schemas.py](C:/Users/admin/Desktop/SkillQuest-Ai/backend/api/schemas.py)
  - request schemas for unlocks, readiness, and tutor chat
- [backend/services/data_loader.py](C:/Users/admin/Desktop/SkillQuest-Ai/backend/services/data_loader.py)
  - loads world map, role blueprints, and state graphs from JSON
- [backend/services/tutor_service.py](C:/Users/admin/Desktop/SkillQuest-Ai/backend/services/tutor_service.py)
  - local Ollama tutor integration and grounded fallback reply
- [backend/services/question_bank_service.py](C:/Users/admin/Desktop/SkillQuest-Ai/backend/services/question_bank_service.py)
  - backend question slicing for city-node questions
- [backend/data/world_map.json](C:/Users/admin/Desktop/SkillQuest-Ai/backend/data/world_map.json)
  - continent/country/state mapping
- [backend/data/role_blueprints.json](C:/Users/admin/Desktop/SkillQuest-Ai/backend/data/role_blueprints.json)
  - professional job roadmaps
- [backend/data/state_graphs.json](C:/Users/admin/Desktop/SkillQuest-Ai/backend/data/state_graphs.json)
  - skill-state city roadmap definitions

### Frontend

- [frontend/src/App.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/App.jsx)
  - entry routing for world, country, and assessment windows
- [frontend/src/components/WorldMap.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/WorldMap.jsx)
  - rotating globe and country launcher
- [frontend/src/components/CountryWindow.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/CountryWindow.jsx)
  - main gameplay screen for a job country
- [frontend/src/components/SkillJourneyPanel.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/SkillJourneyPanel.jsx)
  - rider road and progression status
- [frontend/src/components/AssessmentRouteWindow.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/AssessmentRouteWindow.jsx)
  - separate assessment window shell
- [frontend/src/components/AssessmentWindow.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/AssessmentWindow.jsx)
  - assessment UI and question navigation
- [frontend/src/components/TutorChatPanel.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/TutorChatPanel.jsx)
  - tutor UI, chat history, prompts, and frontend tutor requests
- [frontend/src/api/client.js](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/api/client.js)
  - frontend API client for backend calls including tutor chat
- [frontend/src/data/assessmentQuestionBank.js](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/data/assessmentQuestionBank.js)
  - subject-based bank content for each skill
- [frontend/src/data/assessmentGenerator.js](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/data/assessmentGenerator.js)
  - selects the live 30-question assessment slice
- [frontend/src/styles.css](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/styles.css)
  - global styling and game-window UI theme

## Tutor Model Setup

The tutor now supports:

1. Gemini free tier via API key
2. local Ollama models
3. grounded fallback replies if neither model path is available

### Recommended Free API Setup

Current default free-tier API tutor model:

- `gemini-2.5-flash-lite`

Set either:

- `GEMINI_API_KEY`
- `GOOGLE_API_KEY`

Optional override:

- `GEMINI_MODEL`

Example:

```powershell
$env:GEMINI_API_KEY="your_key_here"
$env:GEMINI_MODEL="gemini-2.5-flash-lite"
python start_backend.py
```

### Local Model Fallback

If Gemini is not configured, the backend tries Ollama:

- base URL: `http://127.0.0.1:11434`
- model: `qwen2.5:3b`

Configurable with:

- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`

Example:

```powershell
ollama pull qwen2.5:3b
$env:OLLAMA_MODEL="qwen2.5:3b"
python start_backend.py
```

## Run

Backend:

```powershell
cd C:\Users\admin\Desktop\SkillQuest-Ai
pip install -r backend\requirements.txt
python start_backend.py
```

Frontend:

```powershell
cd C:\Users\admin\Desktop\SkillQuest-Ai\frontend
npm install
npm start
```

## What Has Been Done So Far

- built the FastAPI backend for world map, role details, state details, and readiness
- built the React + Vite frontend shell
- created the rotating Earth world lobby
- pinned moving country job labels to the globe
- created multi-window country and assessment flow
- built rider road progression between skill states
- added local map caching and 3D-style country map rendering
- kept India as the most custom country experience
- preserved the Korea-specific custom country flow
- built subject-based assessment banks with 100 questions per skill
- changed assessments to 30 questions using a 7 easy / 15 medium / 8 hard mix
- expanded the job roadmaps so roles now include broader professional skill coverage
- added a tutor chat backend route
- wired the tutor to a local open-source Ollama model with grounded fallback behavior
- updated the README into a real restart and handoff guide

## What Still Needs To Be Done

- turn each city node into an actual playable minigame instead of only static route cards
- redesign the frontend further so it feels more like a premium gaming platform and less like a polished prototype
- add player profiles, authentication, and backend progress persistence
- connect rider movement more directly onto geographic state maps
- add richer job-specific custom worlds beyond India and Korea
- deepen state graphs further with more cities for each professional skill
- add handcrafted explanations for wrong assessment answers
- add real tutoring memory and player history over time
- split the frontend bundle because the build is still large
- add automated tests for tutor routes, world data, and assessment generation

## Notes

- current assessment counts intentionally total 30 using `7 easy`, `15 medium`, and `8 hard`
- local open-source tutor setup was chosen around Ollama with `qwen2.5:3b` as the default lightweight model
- according to the current official Ollama model library, `qwen2.5` and `qwen3` are available local open-source options:
  - [Ollama library](https://ollama.com/library)
  - [qwen2.5 model page](https://ollama.com/library/qwen2.5%3A3b)
