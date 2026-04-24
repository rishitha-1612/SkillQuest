# SkillQuest AI

SkillQuest AI is a gamified learning platform prototype where:

- continents represent job clusters
- countries represent job roles
- states represent major skills
- cities represent playable learning levels inside each skill path

The current build is a multi-window frontend plus FastAPI backend prototype with a globe lobby, local map assets, and a custom India skill-map experience.

## What We Have Built

### 1. Backend API

The backend serves the world structure and learning-path data:

- world map
- role details
- state details
- node graphs
- readiness and unlock logic

Main backend files:

- [backend/main.py](C:/Users/admin/Desktop/SkillQuest-Ai/backend/main.py)
- [backend/api/routes.py](C:/Users/admin/Desktop/SkillQuest-Ai/backend/api/routes.py)
- [backend/services](C:/Users/admin/Desktop/SkillQuest-Ai/backend/services)

### 2. World Lobby Frontend

The main app window acts as the world lobby:

- animated 3D Earth globe
- job-country labels pinned to countries
- labels move with globe rotation
- country click opens a separate country game window

Main files:

- [frontend/src/App.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/App.jsx)
- [frontend/src/components/WorldMap.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/WorldMap.jsx)

### 3. Multi-Window Country Experience

When a country is clicked:

- a new browser window opens
- that country gets its own game screen
- the right-side panel shows the mission board and level route
- the left-side panel shows the country map

Main file:

- [frontend/src/components/CountryWindow.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/CountryWindow.jsx)

### 4. Local Downloaded Maps

We downloaded and cached country/state maps locally to avoid runtime fetch failures:

- country border maps: `*-adm0.json`
- state border maps: `*-adm1.json`

Map folder:

- [frontend/public/maps](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/public/maps)

### 5. India Custom Skill Map

India now has a custom-built themed map scene instead of relying on the raw downloaded image:

- built as a stylized SVG matching the app theme
- major Indian state-like regions represent required skills
- skill labels are rendered directly on the India map
- the highlighted skill regions map to:
  - Karnataka -> Python Programming
  - Rajasthan -> Mathematics & Statistics
  - Maharashtra -> Machine Learning
  - Telangana -> Deep Learning
  - West Bengal -> Data Visualization

### 6. UI Direction

The UI has been shaped toward a friendly gaming dashboard:

- lighter palette
- rounded window panels
- clearer labels
- simpler flow
- soft motion
- easier-to-understand world/country/level separation

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

## Current Flow

### Main Window

1. Open the globe
2. Rotate Earth
3. Click a job-country label
4. Launch a separate country window

### Country Window

1. View the country map
2. Choose a required skill/state
3. View the level route on the right
4. Follow the city progression path

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

- [README.md](C:/Users/admin/Desktop/SkillQuest-Ai/README.md)
- [start_backend.py](C:/Users/admin/Desktop/SkillQuest-Ai/start_backend.py)
- [backend/requirements.txt](C:/Users/admin/Desktop/SkillQuest-Ai/backend/requirements.txt)
- [frontend/package.json](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/package.json)
- [frontend/src/App.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/App.jsx)
- [frontend/src/components/WorldMap.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/WorldMap.jsx)
- [frontend/src/components/CountryWindow.jsx](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/components/CountryWindow.jsx)
- [frontend/src/data/worldConfig.js](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/data/worldConfig.js)
- [frontend/src/styles.css](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/src/styles.css)
- [frontend/public/maps](C:/Users/admin/Desktop/SkillQuest-Ai/frontend/public/maps)

## Current Notes

- India uses a crafted themed map screen
- other countries still use the downloaded local border maps
- the frontend bundle is still large and should be split later

## Next Good Steps

- build custom themed maps for more countries, not just India
- add actual minigames for each city node
- persist progress, XP, and unlock state
- add hover tooltips and richer transitions
- add authentication and player profiles
- code-split the country-window bundle
