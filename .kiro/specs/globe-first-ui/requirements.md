# Requirements Document

## Introduction

SkillQuest currently renders a traditional multi-panel layout where the 3D globe competes for space with a hero header, stat cards, a mission strip, and two side panels. This feature redesigns the main lobby (`WorldLobby`) into a globe-first immersive interface: the 3D globe fills the entire viewport, all secondary UI is hidden by default, and four icon buttons give access to the existing features via overlays. No backend logic, API calls, or Zustand store actions are changed.

## Glossary

- **Globe_View**: The existing `WorldMap` Three.js component that renders the interactive 3D globe.
- **Icon_Dock**: The new minimal UI element containing exactly four icon buttons permanently visible over the globe.
- **Overlay_Panel**: A panel (modal, side drawer, or bottom sheet) that appears on top of the globe when an icon is activated, without fully obscuring the globe.
- **Search_Panel**: The overlay that exposes realm/country search and filtering functionality.
- **Help_Panel**: The overlay that displays onboarding instructions and how-to-play guidance.
- **Leaderboard_Panel**: The overlay that displays player ranking, level, XP, streak, and prestige tier information.
- **Realm_Overview_Panel**: The overlay that renders the existing `CountrySkillsPanel` and `StatePathwayPanel` content for the currently selected country.
- **App_Shell**: The top-level `WorldLobby` React component and its rendered DOM tree.
- **Active_Icon**: An icon button whose associated Overlay_Panel is currently visible.

---

## Requirements

### Requirement 1: Globe Fills the Viewport

**User Story:** As a player, I want the 3D globe to occupy the full screen, so that the world map is the dominant visual element and the experience feels immersive.

#### Acceptance Criteria

1. THE App_Shell SHALL render the Globe_View so that it fills 100% of the viewport width and 100% of the viewport height.
2. THE App_Shell SHALL remove the hero header, stat cards, and mission strip from the default visible layout.
3. WHEN the App_Shell renders, THE Globe_View SHALL have no sibling elements that overlap or obstruct its canvas area by default.
4. THE Globe_View SHALL maintain its existing Three.js scene, lighting, rotation, hover, and click behaviour without modification.

---

### Requirement 2: Icon Dock — Four Persistent Icons

**User Story:** As a player, I want to see exactly four minimal icons at all times, so that I can access features without cluttering the globe view.

#### Acceptance Criteria

1. THE Icon_Dock SHALL contain exactly four icon buttons: Search, Help, Leaderboard, and Realm Overview.
2. THE Icon_Dock SHALL be positioned as a fixed overlay on top of the Globe_View at all times.
3. THE Icon_Dock SHALL use a layout that does not cover the central area of the globe (for example: a vertical dock on one side, or icons placed in screen corners).
4. WHEN no Overlay_Panel is open, THE Icon_Dock SHALL be the only UI element visible over the globe.
5. THE Icon_Dock SHALL remain visible and interactive while any Overlay_Panel is open.

---

### Requirement 3: Icon Visual Design

**User Story:** As a player, I want the icons to look modern and unobtrusive, so that they complement the globe without distracting from it.

#### Acceptance Criteria

1. THE Icon_Dock SHALL render each icon button using an SVG or Unicode symbol that clearly represents its function (magnifying glass for Search, question mark for Help, trophy or podium for Leaderboard, globe or map for Realm Overview).
2. THE Icon_Dock SHALL apply a semi-transparent or frosted-glass background style to each icon button so the globe remains partially visible behind them.
3. WHEN a pointer hovers over an icon button, THE Icon_Dock SHALL apply a visible hover effect (for example: increased opacity, subtle scale, or glow) within 150ms.
4. THE Icon_Dock SHALL use soft or pastel colour tones consistent with the existing `--theme-accent`, `--ink`, and `--muted` CSS custom properties.
5. WHEN an icon button is the Active_Icon, THE Icon_Dock SHALL render that button in a visually distinct active state (for example: highlighted background or accent border).

---

### Requirement 4: Overlay Panel Behaviour

**User Story:** As a player, I want clicking an icon to reveal its panel as an overlay, so that I can use features without leaving the globe view.

#### Acceptance Criteria

1. WHEN a player clicks an icon button, THE App_Shell SHALL toggle the visibility of the corresponding Overlay_Panel.
2. WHEN an Overlay_Panel is visible, THE Globe_View SHALL remain rendered and partially visible behind the panel.
3. WHEN a player clicks the same Active_Icon a second time, THE App_Shell SHALL hide the corresponding Overlay_Panel.
4. WHEN a player clicks a different icon while an Overlay_Panel is already open, THE App_Shell SHALL close the current Overlay_Panel and open the newly selected one.
5. THE App_Shell SHALL support at most one Overlay_Panel open at a time.
6. WHEN an Overlay_Panel opens or closes, THE App_Shell SHALL apply a CSS transition of at least 200ms duration to animate the panel's entrance and exit.
7. IF a player presses the Escape key while an Overlay_Panel is open, THEN THE App_Shell SHALL close the Overlay_Panel.

---

### Requirement 5: Search Panel Content

**User Story:** As a player, I want to search for a realm by name, so that I can quickly navigate to a specific country on the globe.

#### Acceptance Criteria

1. WHEN the Search icon is activated, THE Search_Panel SHALL display a text input field that filters the list of playable realms by name.
2. WHEN a player types in the search input, THE Search_Panel SHALL update the displayed realm list to show only realms whose title contains the typed string (case-insensitive match).
3. WHEN a player selects a realm from the Search_Panel list, THE App_Shell SHALL invoke the existing `onCountrySelect` callback with the selected country's `continentId` and country object, preserving all existing downstream behaviour.
4. WHEN the Search_Panel is opened, THE Search_Panel SHALL automatically focus the text input field.

---

### Requirement 6: Help Panel Content

**User Story:** As a new player, I want to read how the game works, so that I understand how to navigate and progress.

#### Acceptance Criteria

1. WHEN the Help icon is activated, THE Help_Panel SHALL display the existing "How It Works" instructional content currently shown in the mission strip.
2. THE Help_Panel SHALL explain the three-step loop: pick a realm, clear city games, unlock the next state.
3. THE Help_Panel SHALL list the currently locked world regions sourced from `LOCKED_WORLD_REGIONS`.

---

### Requirement 7: Leaderboard Panel Content

**User Story:** As a player, I want to view my progress stats at a glance, so that I can track my level, XP, rank, and streak.

#### Acceptance Criteria

1. WHEN the Leaderboard icon is activated, THE Leaderboard_Panel SHALL display the player's current Level, XP, Rank (prestige tier), and Streak sourced from the existing Zustand `usePlayerStore`.
2. THE Leaderboard_Panel SHALL display the total number of playable realms sourced from `countryMetrics`.
3. THE Leaderboard_Panel SHALL NOT introduce new API calls or modify the Zustand store.

---

### Requirement 8: Realm Overview Panel Content

**User Story:** As a player, I want to view the skill details of a selected realm, so that I can explore provinces and plan my learning path.

#### Acceptance Criteria

1. WHEN the Realm Overview icon is activated, THE Realm_Overview_Panel SHALL render the existing `CountrySkillsPanel` component with the currently selected country, role details, states metadata, selected state ID, and `onStateSelect` callback.
2. WHEN the Realm Overview icon is activated, THE Realm_Overview_Panel SHALL render the existing `StatePathwayPanel` component with the currently selected state details.
3. WHEN no country has been selected yet, THE Realm_Overview_Panel SHALL display the default empty-state message from `CountrySkillsPanel` ("Pick a realm.").
4. THE Realm_Overview_Panel SHALL NOT modify the props, internal logic, or rendering of `CountrySkillsPanel` or `StatePathwayPanel`.

---

### Requirement 9: Globe Interaction Preserved

**User Story:** As a player, I want to click and drag the globe as before, so that my existing navigation experience is not disrupted.

#### Acceptance Criteria

1. THE Globe_View SHALL respond to pointer drag events to rotate the globe regardless of whether an Overlay_Panel is open.
2. WHEN a player clicks a country label on the Globe_View, THE App_Shell SHALL invoke `onCountrySelect` and open the country in a new browser window, preserving the existing behaviour.
3. THE Globe_View SHALL continue its auto-rotation animation when no drag is in progress.
4. THE App_Shell SHALL NOT modify any props passed to Globe_View beyond what is required to support the new layout.

---

### Requirement 10: Responsiveness

**User Story:** As a player on different screen sizes, I want the interface to remain usable, so that the globe and icons are accessible on both desktop and mobile viewports.

#### Acceptance Criteria

1. THE Icon_Dock SHALL reposition or resize its buttons so that they do not overlap the central globe area on viewports narrower than 768px.
2. WHEN an Overlay_Panel is open on a viewport narrower than 768px, THE Overlay_Panel SHALL occupy no more than 85% of the viewport width.
3. THE Globe_View canvas SHALL resize to fill the updated viewport dimensions when the browser window is resized, using the existing `onResize` handler in `WorldMap.jsx`.

---

### Requirement 11: No Backend or State Management Changes

**User Story:** As a developer, I want the redesign to be purely a UI change, so that no regressions are introduced in data flow or business logic.

#### Acceptance Criteria

1. THE App_Shell SHALL NOT modify, remove, or add any calls to the `api` client module.
2. THE App_Shell SHALL NOT modify, remove, or add any actions or selectors in the Zustand `usePlayerStore`.
3. THE App_Shell SHALL NOT alter the props interface or internal implementation of `WorldMap.jsx`, `CountrySkillsPanel.jsx`, or `StatePathwayPanel.jsx`.
4. THE App_Shell SHALL continue to call `useBootstrapData` and pass its results to child components exactly as before.
