# SkillQuest AI

SkillQuest AI is a gamified learning platform prototype where:

- continents represent job clusters
- countries represent job roles
- states represent major skills
- cities represent playable learning levels inside each skill path

The current build is a multi-window frontend + FastAPI backend prototype.

## What We Built So Far

### 1. Backend API

The backend lives in [backend](C:/Users/admin/Desktop/SkillQuest-Ai/backend) and serves:

- world map structure
- role details
- skill state details
- node/level graph data
- readiness and unlock logic

Main backend entry:

- [backend/main.py](C:/Users/admin/Desktop/SkillQuest-Ai/backend/main.py)

### 2. World Lobby Frontend

The main frontend window is the world lobby:

- animated 3D globe
- continents mapped to job clusters
- country markers mapped to job roles
- cleaner, easier-to-understand UI
- lighter game-like color palette

Main frontend entry:

- [frontend/src/App.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/App.jsx)

### 3. Multi-Window Country Experience

When a user clicks a country in the globe:

- a new browser window opens
- that window loads the real country map
- the real admin-1 regions are reused as animated skill provinces
- each province can be clicked to open its level path

Country window component:

- [frontend/src/components/CountryWindow.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/CountryWindow.jsx)

### 4. Local Downloaded Maps

To avoid live-fetch errors, we downloaded and cached real country/state map files locally in:

- [frontend/public/maps](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/public/maps)

These are based on geoBoundaries ADM1 data and are mapped to the configured job-role countries.

Role-to-country config:

- [frontend/src/data/worldConfig.js](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/data/worldConfig.js)

### 5. Game UI Direction

The UI has been shifted toward:

- simpler wording
- brighter and more pleasant colors
- window-style panels
- animated regions
- clearer level progression

Primary styling file:

- [frontend/src/styles.css](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/styles.css)

## Tech Stack

### Frontend

- React
- Vite
- Three.js
- d3-geo
- topojson-client
- world-atlas

### Backend

- FastAPI
- Uvicorn

## Project Flow

### Main Window

1. Open the globe
2. Click a country/job realm
3. Launch a separate country game window

### Country Window

1. View the real country map
2. Click a province/skill
3. Inspect the level path
4. Progress through city nodes

## Run

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

- [start_backend.py](C:/Users/admin/Desktop/SkillQuest-Ai/start_backend.py)
- [backend/requirements.txt](C:/Users/admin/Desktop/SkillQuest-Ai/backend/requirements.txt)
- [frontend/package.json](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/package.json)
- [frontend/src/App.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/App.jsx)
- [frontend/src/components/WorldMap.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/WorldMap.jsx)
- [frontend/src/components/CountryWindow.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/CountryWindow.jsx)
- [frontend/src/styles.css](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/styles.css)

## Next Good Steps

- add actual minigames for each city node
- persist player progress and XP
- add locked/unlocked state saving
- add audio, transitions, and reward feedback
- add authentication and player profiles
- split the large frontend bundle into smaller chunks
