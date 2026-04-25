# SkillQuest AI

SkillQuest AI is being rebuilt as a professional learning-game platform inspired by the clarity of Duolingo, the challenge loop of LeetCode, and the world-building feel of a game map.

Current core fantasy:

- continents = job clusters
- countries = job roles
- states = major professional skills for that role
- cities = learning quests inside a skill
- boss fights = end-of-skill assessments
- Nova = AI companion tutor

The goal is not a generic course site. The goal is a structured gaming platform where users learn job-ready skills by progressing through worlds, quests, minigames, and boss battles.

## Resume Here

When this project is reopened in a fresh chat, use this order:

1. Read this README.
2. Open [frontend/src/App.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/App.jsx) for the top-level window flow.
3. Open [frontend/src/components/WorldMap.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/WorldMap.jsx) for the lobby globe.
4. Open [frontend/src/components/CountryWindow.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/CountryWindow.jsx) for the main gameplay loop.
5. Open [frontend/src/store/playerStore.js](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/store/playerStore.js) for player identity, XP, unlocks, and persistence.
6. Open [backend/data/role_blueprints.json](C:/Users/admin/Desktop/SkillQuest-Ai/backend/data/role_blueprints.json) and [backend/data/state_graphs.json](C:/Users/admin/Desktop/SkillQuest-Ai/backend/data/state_graphs.json) for the actual skill roadmap.
7. Open [frontend/src/data/assessmentQuestionBank.js](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/data/assessmentQuestionBank.js) for the assessment content.
8. Open [frontend/src/components/TutorChatPanel.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/TutorChatPanel.jsx) and [backend/services/tutor_service.py](C:/Users/admin/Desktop/SkillQuest-Ai/backend/services/tutor_service.py) for the tutor flow.

## Product Architecture Target

The target platform has 6 major systems:

1. Identity System
2. Exploration System
3. Gameplay System
4. Progression System
5. Assessment System
6. Social + Retention System

The current rebuild already covers meaningful parts of the first 5. Social + retention has been scaffolded in state/store ideas, but it is not complete yet.

## What Exists Right Now

### 1. Identity System

Implemented in [frontend/src/store/playerStore.js](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/store/playerStore.js).

Current player state includes:

- `username`
- `level`
- `xp`
- `avatar`
- `unlockedSkills`
- `currentRole`
- `achievements`
- `recentMistakes`
- `completedCities`
- `unlockedCities`
- `dailyQuests`

Current capabilities:

- XP gain
- level progression
- city completion tracking
- skill unlock tracking
- recent mistake memory for tutor guidance
- local persistence with Zustand + localStorage

### 2. Exploration System

The world lobby is in [frontend/src/components/WorldMap.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/WorldMap.jsx).

Current lobby behavior:

- rotating 3D globe
- role-country labels pinned to countries
- labels move with globe rotation
- labels use a simplified stable click-target mode for easier interaction
- active countries glow more strongly
- clicking a country opens a dedicated game window

Top-level lobby shell is in [frontend/src/App.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/App.jsx).

### 3. Gameplay System

The main country gameplay screen is in [frontend/src/components/CountryWindow.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/CountryWindow.jsx).

Current game loop:

- select a skill-state
- open city quests
- play a minigame
- gain XP
- unlock the next city
- finish all cities
- open boss assessment
- unlock the next skill-state

Current minigames:

- [frontend/src/minigames/CodePuzzle.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/minigames/CodePuzzle.jsx)
- [frontend/src/minigames/DragDropLogic.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/minigames/DragDropLogic.jsx)
- [frontend/src/minigames/DebugChallenge.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/minigames/DebugChallenge.jsx)
- [frontend/src/minigames/ArchitectureArena.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/minigames/ArchitectureArena.jsx)
- [frontend/src/minigames/PromptDuel.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/minigames/PromptDuel.jsx)
- [frontend/src/minigames/DataDetective.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/minigames/DataDetective.jsx)
- [frontend/src/minigames/ThreatHunt.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/minigames/ThreatHunt.jsx)
- [frontend/src/minigames/ModelSculptor.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/minigames/ModelSculptor.jsx)
- [frontend/src/minigames/ChainBuilder.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/minigames/ChainBuilder.jsx)

These are lightweight gameplay components for now. They establish the minigame architecture, but they still need deeper subject-specific logic to feel like a full production platform.

### 4. Progression System

Backend progression logic now exists in [backend/services/progression_engine.py](C:/Users/admin/Desktop/SkillQuest-Ai/backend/services/progression_engine.py).

Current progression rules:

- XP is awarded based on city difficulty and performance
- completing a city unlocks the next connected city
- finishing all non-boss cities unlocks the boss gate
- player level progression is returned from the backend

API route:

- [backend/api/routes.py](C:/Users/admin/Desktop/SkillQuest-Ai/backend/api/routes.py) -> `POST /career-globe/states/{state_id}/progression`

Frontend API helper:

- [frontend/src/api/client.js](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/api/client.js)

Journey UI:

- [frontend/src/components/SkillJourneyPanel.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/SkillJourneyPanel.jsx)

### 5. Assessment System

Assessments are no longer just plain quizzes. The main assessment experience is in [frontend/src/components/AssessmentWindow.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/AssessmentWindow.jsx).

Current assessment behavior:

- opens in a separate window
- uses a 3-wave boss-fight presentation
- has player HP
- has boss HP
- has a per-question timer
- correct answers damage the boss
- wrong answers damage the player
- wave 2 uses a tighter timer
- wave 3 uses harsher damage on mistakes
- tab switching fails the run
- the tutor is locked while assessment is active

Assessment window shell:

- [frontend/src/components/AssessmentRouteWindow.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/AssessmentRouteWindow.jsx)

Question generation:

- [frontend/src/data/assessmentGenerator.js](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/data/assessmentGenerator.js)
- [frontend/src/data/assessmentQuestionBank.js](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/data/assessmentQuestionBank.js)

Current assessment format:

- `30` questions per attempt
- fresh set each attempt
- pulled from a `100` question bank per skill
- difficulty mix:
  - `7` easy
  - `15` medium
  - `8` hard

### 6. AI Companion

The tutor is now a guided companion, not just a textbox.

Frontend:

- [frontend/src/components/TutorChatPanel.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/TutorChatPanel.jsx)

Backend:

- [backend/services/tutor_service.py](C:/Users/admin/Desktop/SkillQuest-Ai/backend/services/tutor_service.py)
- [backend/api/routes.py](C:/Users/admin/Desktop/SkillQuest-Ai/backend/api/routes.py)
- [backend/api/schemas.py](C:/Users/admin/Desktop/SkillQuest-Ai/backend/api/schemas.py)

Current tutor features:

- named AI companion: `Nova`
- role-aware replies
- skill-aware replies
- recent mistake awareness
- player level awareness
- simple explanations
- analogy-style help
- roadmap-aware guidance
- assessment lockout support

Current provider order:

1. Gemini free-tier API when configured
2. Ollama local model fallback
3. grounded local fallback reply

## Role and Skill Data

These are the main content files:

- [backend/data/world_map.json](C:/Users/admin/Desktop/SkillQuest-Ai/backend/data/world_map.json)
  - continent and country mapping
- [backend/data/role_blueprints.json](C:/Users/admin/Desktop/SkillQuest-Ai/backend/data/role_blueprints.json)
  - job titles, summaries, tools, state requirements, and professional role structure
- [backend/data/state_graphs.json](C:/Users/admin/Desktop/SkillQuest-Ai/backend/data/state_graphs.json)
  - state-level city graphs and learning nodes

These are the current major job countries:

- AI Engineer
- ML Engineer
- Data Scientist
- Cybersecurity Specialist
- Cloud Architect
- Software Developer
- Full Stack Engineer
- Data Engineer
- Blockchain Developer
- Prompt Engineer

Important note:

- South Korea has custom work from another contributor and should not be carelessly overwritten.

## Country and Map Systems

Map rendering components:

- [frontend/src/components/CountryMap3D.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/CountryMap3D.jsx)
- [frontend/src/components/India3DMap.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/India3DMap.jsx)
- [frontend/src/components/Korea3DMap.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/Korea3DMap.jsx)
- [frontend/src/components/China3DMap.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/China3DMap.jsx)
- [frontend/src/components/SaudiArabia3DMap.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/SaudiArabia3DMap.jsx)

Local map assets:

- [frontend/public/maps](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/public/maps)

Current map status:

- world lobby works
- country windows work
- several custom country renderers exist
- India and Korea have more custom treatment than the generic countries
- India, Korea, Saudi Arabia, and China keep their explicit custom map routes
- other countries fall back to the simpler local state-border renderer for stability

## UI Layer

Global styling is in [frontend/src/styles.css](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/styles.css).

Current UI direction:

- lighter Duolingo-like homepage aesthetic
- simpler lobby copy
- softer white cards and sky background
- reduced homepage panel density
- quest cards and boss-fight windows still keep the game layer

This is more game-like than before, but it still needs another serious polish pass to reach true premium product quality.

## Backend File Guide

- [backend/main.py](C:/Users/admin/Desktop/SkillQuest-Ai/backend/main.py)
  - FastAPI app startup
- [backend/api/routes.py](C:/Users/admin/Desktop/SkillQuest-Ai/backend/api/routes.py)
  - health, world map, role details, state details, tutor chat, progression
- [backend/api/schemas.py](C:/Users/admin/Desktop/SkillQuest-Ai/backend/api/schemas.py)
  - tutor request schema, progression request schema, unlock/readiness schemas
- [backend/services/data_loader.py](C:/Users/admin/Desktop/SkillQuest-Ai/backend/services/data_loader.py)
  - JSON loading
- [backend/services/progression_engine.py](C:/Users/admin/Desktop/SkillQuest-Ai/backend/services/progression_engine.py)
  - XP and node unlocking logic
- [backend/services/tutor_service.py](C:/Users/admin/Desktop/SkillQuest-Ai/backend/services/tutor_service.py)
  - Nova backend logic, provider selection, grounded fallback
- [backend/services/question_bank_service.py](C:/Users/admin/Desktop/SkillQuest-Ai/backend/services/question_bank_service.py)
  - question slice utilities

## Frontend File Guide

- [frontend/src/App.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/App.jsx)
  - lobby + country window + assessment window routing
- [frontend/src/components/WorldMap.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/WorldMap.jsx)
  - lobby globe and country launch flow
- [frontend/src/components/CountryWindow.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/CountryWindow.jsx)
  - main playable country screen
- [frontend/src/components/SkillJourneyPanel.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/SkillJourneyPanel.jsx)
  - road progression display
- [frontend/src/components/AssessmentRouteWindow.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/AssessmentRouteWindow.jsx)
  - separate assessment shell and anti-cheat locking
- [frontend/src/components/AssessmentWindow.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/AssessmentWindow.jsx)
  - boss fight assessment gameplay
- [frontend/src/components/TutorChatPanel.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/TutorChatPanel.jsx)
  - Nova chat UI
- [frontend/src/store/playerStore.js](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/store/playerStore.js)
  - persistent player identity and progress
- [frontend/src/minigames](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/minigames)
  - quest minigame components
- [frontend/src/api/client.js](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/api/client.js)
  - frontend API wrapper
- [frontend/src/data/worldConfig.js](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/data/worldConfig.js)
  - world/country role config and realm metadata
- [frontend/src/data/assessmentLock.js](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/data/assessmentLock.js)
  - assessment lock state used to disable tutor during tests

## Tutor Setup

### Free API path

Use Gemini free tier with an API key:

```powershell
cd C:\Users\admin\Desktop\SkillQuest-Ai
$env:GEMINI_API_KEY="your_key_here"
$env:GEMINI_MODEL="gemini-2.5-flash-lite"
python start_backend.py
```

### Local model fallback

Use Ollama if desired:

```powershell
ollama pull qwen2.5:3b
cd C:\Users\admin\Desktop\SkillQuest-Ai
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

## What We Have Done So Far

- built the FastAPI backend
- built the React frontend shell
- created the rotating world lobby
- pinned moving role labels to countries
- simplified globe labels into a more stable click-target mode
- created dedicated country windows
- created dedicated assessment windows
- introduced a persistent player store with XP and unlocks
- turned city nodes into minigame launchers
- added 3 starter minigame components
- added backend progression logic
- turned assessments into boss-fight style battles
- locked the tutor during assessments
- added anti-tab-switch cheating protection
- upgraded the tutor into Nova, a player-aware AI companion
- added free API tutor support with Gemini
- kept Ollama as a local fallback
- expanded assessment banks to 100 questions per skill
- kept assessments fresh on every attempt
- preserved custom country flows like Korea
- updated the UI toward a more game-academy structure
- simplified the homepage back toward a cleaner, lighter, easier-to-understand style

## What Still Needs To Be Done

The project is improved, but it is not yet at the final target quality. These are the next major steps:

1. Replace starter minigames with deeper subject-specific gameplay.
2. Add real mini-lessons, not just quest cards and minigame entry points.
3. Add ranked drill mode as a standalone gameplay system.
4. Make boss fights richer with stronger feedback, audio, and visual response.
5. Add cinematic zoom and camera transition into countries on globe click.
6. Add proper social systems:
   - leaderboard
   - friends
   - weekly reset
7. Add retention systems:
   - daily streaks
   - daily quests UI
   - rewards and badges
8. Move persistence from localStorage toward a real backend database layer.
9. Introduce auth and user accounts.
10. Upgrade the UI from polished prototype to premium gaming product quality.

## Recommended Stack Direction

Frontend:

- React
- Zustand
- Framer Motion
- React Three Fiber / Three.js

Backend:

- FastAPI
- PostgreSQL
- Redis
- WebSockets

AI:

- Gemini API for low-cost tutor calls
- optional local Ollama fallback
- later: memory store / vector retrieval for longer-term tutor memory

## Verification

After major changes, run:

```powershell
cd C:\Users\admin\Desktop\SkillQuest-Ai\frontend
npm run build
```

```powershell
cd C:\Users\admin\Desktop\SkillQuest-Ai
python -m compileall backend
```
