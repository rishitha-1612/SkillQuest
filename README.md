# SkillQuest AI

SkillQuest AI is a gamified career-learning prototype where the whole product behaves like a world map game:

- continents are job clusters
- countries are career paths
- states are the skills required for that job
- city nodes are the playable learning levels inside each skill

The current build is a React + Vite frontend with a FastAPI backend, a rotating Earth lobby, multi-window country screens, local downloaded map assets, and a custom India career world.

## Current Career Countries

The active world now uses these 10 jobs as countries:

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

These jobs are mapped onto large nations so the bigger countries carry the heavier and more complex roles. India is intentionally assigned to `AI Engineer`.

Current country assignment:

- Russia -> Cloud Architect
- Canada -> Full Stack Engineer
- China -> Cybersecurity Specialist
- United States -> Data Engineer
- Brazil -> ML Engineer
- India -> AI Engineer
- Australia -> Data Scientist
- Kazakhstan -> Blockchain Developer
- Saudi Arabia -> Prompt Engineer
- South Africa -> Software Developer

## Game Structure

### World Lobby

The main window is the world lobby:

- rotating 3D Earth built with Three.js
- job labels pinned to country positions
- labels move with the countries as the Earth rotates
- clicking a country opens a separate country game window

Main files:

- [frontend/src/App.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/App.jsx)
- [frontend/src/components/WorldMap.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/WorldMap.jsx)

### Country Windows

Each country opens in its own window:

- left side shows the country map
- right side shows the mission board, rider progress road, tutor chat, and level route
- clicking a skill switches the active progression path
- each skill must be cleared with an assessment before the next skill unlocks

Main file:

- [frontend/src/components/CountryWindow.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/CountryWindow.jsx)

### Assessment Flow

Every skill now has a built-in assessment gate:

- 25 multiple-choice questions per skill
- user must score 75% or higher to pass
- next skill only unlocks after the current skill assessment is passed
- assessment is launched from the end of the skill route using a `Take Assessment` button
- assessment opens in a separate window instead of inside the country screen
- assessment locks the tutor chat across the app while the assessment window is open
- changing away from the assessment tab marks the attempt as failed
- question navigator shows:
  - green for answered questions
  - yellow for opened but unanswered questions
  - blue-white for questions not opened yet

Main files:

- [frontend/src/components/AssessmentWindow.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/AssessmentWindow.jsx)
- [frontend/src/components/AssessmentRouteWindow.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/AssessmentRouteWindow.jsx)
- [frontend/src/data/assessmentGenerator.js](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/data/assessmentGenerator.js)

### Rider Journey

Country windows now include a rider progress panel:

- required skills are connected by a road journey
- the rider marker shows current progress through the country
- completed skills move the rider farther down the road
- locked skills stay ahead of the rider until the previous assessment is cleared

Main file:

- [frontend/src/components/SkillJourneyPanel.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/SkillJourneyPanel.jsx)

### Tutor Chat

Country learning windows now include a tutor chat panel:

- user can ask for help about the project
- user can ask about the active job path or current skill
- user can type questions and use voice input where browser speech recognition is available
- tutor responses are more learner-friendly and explain things in simpler language
- tutor gives analogies to help users understand difficult topics more easily
- quick prompt chips help users ask common learning questions faster
- chat is disabled whenever an assessment window is active

Main file:

- [frontend/src/components/TutorChatPanel.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/TutorChatPanel.jsx)

### India Special World

India has a custom country experience:

- India is the `AI Engineer` country
- it uses a custom themed India 3D-style map rather than the generic geojson map
- the mapped Indian states show the AI Engineer skill set:
  - Python Programming
  - Mathematics & Statistics
  - Machine Learning
  - Deep Learning
  - Data Visualization

Main file:

- [frontend/src/components/India3DMap.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/India3DMap.jsx)

## Backend Data Model

The backend now serves the updated 10-job world.

### World Map Data

The job-country roster is stored in:

- [backend/data/world_map.json](C:/Users/admin/Desktop/SkillQuest-Ai/backend/data/world_map.json)

### Role Blueprints

Each job has:

- title
- summary
- responsibilities
- tools
- required skill states
- dependency graph between those skill states

Stored in:

- [backend/data/role_blueprints.json](C:/Users/admin/Desktop/SkillQuest-Ai/backend/data/role_blueprints.json)

### Skill State Graphs

Each state has:

- title
- entry node
- final assessment node
- learning levels
- graph edges between levels

Stored in:

- [backend/data/state_graphs.json](C:/Users/admin/Desktop/SkillQuest-Ai/backend/data/state_graphs.json)

## Skill States Added

To support the new jobs, the project now includes extra skill-state tracks beyond the original AI and cloud set.

Added skill states:

- Frontend Development
- Backend Development
- SQL and Databases
- Cybersecurity Fundamentals
- DevSecOps Security
- Blockchain Fundamentals
- Prompt Engineering
- Data Engineering
- API Integration

Existing skill states still used:

- Python Programming
- Mathematics & Statistics
- Machine Learning
- Deep Learning
- Data Visualization
- Cloud Platforms
- Networking Fundamentals
- Containers & Orchestration
- CI/CD Pipelines
- System Design

## Local Maps

Country and state-border maps are cached locally to avoid runtime fetch failures.

Map folder:

- [frontend/public/maps](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/public/maps)

Current local maps include:

- India
- Russia
- China
- United States
- Canada
- Brazil
- Australia
- Kazakhstan
- Saudi Arabia
- South Africa

Each country window uses these local files instead of relying on live downloads.

### 3D-Style Country Maps

The active country worlds now use a richer raised-map style:

- India keeps its custom 3D-themed map
- the other active countries use the downloaded local border data rendered in a 3D-style stacked map view
- this uses the local country/state boundaries already stored in the project

Main file:

- [frontend/src/components/CountryMap3D.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/CountryMap3D.jsx)

## Frontend Tech Stack

- React
- Vite
- Three.js
- d3-geo
- topojson-client
- world-atlas

## Backend Tech Stack

- FastAPI
- Uvicorn

## How To Run

Backend:

```powershell
cd C:\Users\admin\Desktop\SkillQuest-Ai
python start_backend.py
```

Frontend:

```powershell
cd C:\Users\admin\Desktop\SkillQuest-Ai\frontend
npm start
```

## Install

Backend:

```powershell
cd C:\Users\admin\Desktop\SkillQuest-Ai
pip install -r backend\requirements.txt
```

Frontend:

```powershell
cd C:\Users\admin\Desktop\SkillQuest-Ai\frontend
npm install
```

## Important Files

- [README.md](C:/Users/admin/Desktop/SkillQuest-Ai/README.md)
- [start_backend.py](C:/Users/admin/Desktop/SkillQuest-Ai/start_backend.py)
- [backend/main.py](C:/Users/admin/Desktop/SkillQuest-Ai/backend/main.py)
- [backend/data/world_map.json](C:/Users/admin/Desktop/SkillQuest-Ai/backend/data/world_map.json)
- [backend/data/role_blueprints.json](C:/Users/admin/Desktop/SkillQuest-Ai/backend/data/role_blueprints.json)
- [backend/data/state_graphs.json](C:/Users/admin/Desktop/SkillQuest-Ai/backend/data/state_graphs.json)
- [frontend/src/App.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/App.jsx)
- [frontend/src/components/WorldMap.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/WorldMap.jsx)
- [frontend/src/components/CountryWindow.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/CountryWindow.jsx)
- [frontend/src/components/AssessmentWindow.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/AssessmentWindow.jsx)
- [frontend/src/components/AssessmentRouteWindow.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/AssessmentRouteWindow.jsx)
- [frontend/src/components/SkillJourneyPanel.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/SkillJourneyPanel.jsx)
- [frontend/src/components/TutorChatPanel.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/TutorChatPanel.jsx)
- [frontend/src/components/CountryMap3D.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/CountryMap3D.jsx)
- [frontend/src/components/India3DMap.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/India3DMap.jsx)
- [frontend/src/data/worldConfig.js](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/data/worldConfig.js)
- [frontend/src/data/assessmentGenerator.js](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/data/assessmentGenerator.js)
- [frontend/src/data/assessmentLock.js](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/data/assessmentLock.js)
- [frontend/src/styles.css](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/styles.css)

## What Has Been Done So Far

- built the FastAPI backend for world map, role details, and state details
- built the React frontend and Vite app shell
- created the rotating 3D Earth lobby
- pinned job labels to country positions on the globe
- fixed the globe labels so they move with the rotating countries
- created multi-window country screens
- cached local country and state-border maps in the project
- integrated a custom India career map experience
- rebuilt the world roster around 10 requested job countries
- assigned larger countries to more complex roles
- made India the AI Engineer world
- added new skill-state graphs for software, security, data engineering, blockchain, and prompt work
- pulled the latest upstream changes before extending the next feature set
- added 25-question assessment gates for every skill
- added pass/fail unlocking logic with a 75% threshold
- moved assessments to a dedicated end-of-course window launched from the skill route
- added a rider progress road that shows current skill position and destination
- added a tutor chat panel for project help and skill tutoring
- made the tutor more learner-friendly with simpler answers, analogies, and guided prompt chips
- blocked tutor chat while any assessment window is active
- added tab-switch detection to fail assessment attempts that leave the exam window
- upgraded generic country maps to 3D-style local map rendering
- rebuilt the shared country window after an upstream pull so the rider journey, tutor chat, and end-of-skill assessment flow are active again
- preserved the Korea-specific country experience while restoring the shared systems around it
- updated the README to reflect the current product state

## What Still Needs To Be Done

- add real minigames inside each city node instead of only static progression cards
- move progress storage from local browser storage to a proper backend player profile
- add authentication and player profiles
- add hover tooltips and richer interactions on generic country maps
- add locked continent visuals directly on the globe itself
- improve country-window transitions and in-window navigation
- add richer question banks instead of the current generated assessment questions
- connect the rider road more directly to the rendered geographic state map for every country
- split the frontend bundle because the current build is still large
- add tests for the world data and frontend map rendering
- optionally build custom themed maps for more countries the way India has one

## Notes

- India is still the most polished country-specific experience
- generic countries currently use local border maps with the shared country window
- assessment progress is currently stored in browser local storage per country window
- the frontend build currently succeeds, but Vite still warns that the main JS chunk is large
