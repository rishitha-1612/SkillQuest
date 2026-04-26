# Design Document: Globe-First UI

## Overview

This design transforms the SkillQuest main lobby from a traditional multi-panel layout into an immersive globe-first experience. The 3D globe will fill the entire viewport, with all secondary UI hidden by default. Four minimal icon buttons provide access to existing features via overlay panels. This is a pure UI redesign—no backend logic, API calls, or state management changes are required.

### Design Goals

1. **Immersive Experience**: Make the 3D globe the dominant visual element
2. **Minimal UI**: Reduce visual clutter with a clean icon-based interface
3. **Preserved Functionality**: Surface all existing features without modification
4. **Zero Backend Changes**: Maintain all existing data flow and business logic
5. **Responsive Design**: Ensure usability across desktop and mobile viewports

### Key Principles

- **Progressive Disclosure**: Hide complexity until needed
- **Spatial Consistency**: Icons remain fixed; overlays appear predictably
- **Smooth Transitions**: All UI changes animate gracefully (200ms minimum)
- **Accessibility**: Keyboard navigation (Escape to close) and clear visual states

---

## Architecture

### Component Hierarchy

```
App (WorldLobby)
├── GlobeView (WorldMap.jsx) — fills viewport
└── IconDock (new)
    ├── SearchIcon → SearchPanel (new overlay)
    ├── HelpIcon → HelpPanel (new overlay)
    ├── LeaderboardIcon → LeaderboardPanel (new overlay)
    └── RealmOverviewIcon → RealmOverviewPanel (new overlay)
        ├── CountrySkillsPanel (existing, reused)
        └── StatePathwayPanel (existing, reused)
```

### State Management Approach

**No new Zustand stores or actions.** All state is managed via React `useState` hooks in the `WorldLobby` component:

```javascript
const [activeOverlay, setActiveOverlay] = useState(null); 
// null | 'search' | 'help' | 'leaderboard' | 'realm-overview'
```

**Existing state hooks remain unchanged:**
- `useBootstrapData()` — loads continents, states, roles
- `usePlayerStore()` — accesses level, XP, streak, prestige tier
- `selectedCountry`, `selectedStateId`, `roleDetails`, `stateDetails` — existing selection state

### Data Flow

1. **Icon Click** → `setActiveOverlay('panel-name')`
2. **Overlay Render** → Conditional render based on `activeOverlay` value
3. **Escape Key** → `setActiveOverlay(null)`
4. **Overlay Close Button** → `setActiveOverlay(null)`
5. **Different Icon Click** → `setActiveOverlay('new-panel-name')` (auto-closes previous)

**No props changes to existing components:**
- `WorldMap` receives same props: `countryMetrics`, `selectedCountryId`, `onCountrySelect`
- `CountrySkillsPanel` receives same props: `country`, `roleDetails`, `statesMeta`, `selectedStateId`, `onStateSelect`
- `StatePathwayPanel` receives same props: `stateDetails`

---

## Components and Interfaces

### 1. IconDock Component

**Purpose**: Persistent overlay containing four icon buttons

**Props**: None (uses context or parent state via callbacks)

**Interface**:
```typescript
interface IconDockProps {
  activeOverlay: string | null;
  onIconClick: (overlayName: string) => void;
}
```

**Behavior**:
- Renders four icon buttons: Search, Help, Leaderboard, Realm Overview
- Applies `active` class to button matching `activeOverlay`
- Calls `onIconClick(overlayName)` when button is clicked
- Positioned fixed, does not scroll with page

**Layout Options**:
- **Option A**: Vertical dock on right edge (desktop), bottom edge (mobile)
- **Option B**: Four corners (one icon per corner)
- **Recommended**: Vertical dock on right edge, 24px from edge, vertically centered

**Icon Symbols**:
- Search: `🔍` or SVG magnifying glass
- Help: `❓` or SVG question mark
- Leaderboard: `🏆` or SVG trophy/podium
- Realm Overview: `🗺️` or SVG globe/map

---

### 2. SearchPanel Component

**Purpose**: Overlay for realm search and filtering

**Props**:
```typescript
interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  countryMetrics: CountryMetric[];
  onCountrySelect: (continentId: string, country: CountryMetric) => void;
}
```

**State**:
```javascript
const [searchQuery, setSearchQuery] = useState('');
```

**Behavior**:
- Auto-focus text input when `isOpen` becomes true
- Filter `countryMetrics` by `country.title.toLowerCase().includes(searchQuery.toLowerCase())`
- Display filtered list as clickable cards
- Call `onCountrySelect(country.continentId, country)` when card is clicked
- Call `onClose()` when close button or Escape is pressed

**Layout**:
- Side drawer from right (400px width on desktop, 85% on mobile)
- Slide-in animation (200ms ease-out)
- Semi-transparent backdrop (rgba(0,0,0,0.3))

---

### 3. HelpPanel Component

**Purpose**: Overlay for onboarding and instructions

**Props**:
```typescript
interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Content**:
- **Title**: "How It Works"
- **Body**: 
  - "Learn, play, and clear boss battles."
  - "Pick a realm, clear city games, unlock the next state."
- **Locked Regions**: Display `LOCKED_WORLD_REGIONS.join(', ')`

**Layout**:
- Modal centered on screen (max-width 600px)
- Fade-in animation (200ms ease-out)
- Semi-transparent backdrop

---

### 4. LeaderboardPanel Component

**Purpose**: Overlay for player stats and progress

**Props**:
```typescript
interface LeaderboardPanelProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  xp: number;
  streakCount: number;
  prestigeTier: string;
  totalRealms: number;
}
```

**Content**:
- **Stats Grid**:
  - Level: `{level}`
  - XP: `{xp}`
  - Rank: `{prestigeTier}`
  - Streak: `{streakCount} days`
  - Total Realms: `{totalRealms}`

**Layout**:
- Side drawer from left (360px width on desktop, 85% on mobile)
- Slide-in animation (200ms ease-out)
- Semi-transparent backdrop

---

### 5. RealmOverviewPanel Component

**Purpose**: Overlay for selected realm details

**Props**:
```typescript
interface RealmOverviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  country: CountryMetric | null;
  roleDetails: RoleDetails | null;
  statesMeta: Map<string, StateMeta>;
  selectedStateId: string;
  onStateSelect: (stateId: string) => void;
  stateDetails: StateDetails | null;
}
```

**Behavior**:
- Renders `<CountrySkillsPanel />` with existing props
- Renders `<StatePathwayPanel />` with existing props
- Scrollable content area if content exceeds viewport height

**Layout**:
- Side drawer from right (480px width on desktop, 85% on mobile)
- Slide-in animation (200ms ease-out)
- Semi-transparent backdrop

---

## Data Models

### Overlay State

```typescript
type OverlayName = 'search' | 'help' | 'leaderboard' | 'realm-overview' | null;

interface OverlayState {
  activeOverlay: OverlayName;
  setActiveOverlay: (name: OverlayName) => void;
}
```

### Icon Configuration

```typescript
interface IconConfig {
  id: OverlayName;
  label: string;
  icon: string; // Unicode or SVG path
  ariaLabel: string;
}

const ICON_CONFIG: IconConfig[] = [
  { id: 'search', label: 'Search', icon: '🔍', ariaLabel: 'Search realms' },
  { id: 'help', label: 'Help', icon: '❓', ariaLabel: 'View help' },
  { id: 'leaderboard', label: 'Stats', icon: '🏆', ariaLabel: 'View leaderboard' },
  { id: 'realm-overview', label: 'Realm', icon: '🗺️', ariaLabel: 'View realm overview' },
];
```

### No Changes to Existing Models

All existing interfaces remain unchanged:
- `CountryMetric` (from `buildCountryMetrics`)
- `RoleDetails` (from `api.roleDetails`)
- `StateDetails` (from `api.stateDetails`)
- `StateMeta` (from `states` array)
- Player store shape (level, xp, streakCount, etc.)

---

## UI/UX Design Details

### Layout

#### Desktop (≥768px)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                                                     │
│                    GLOBE VIEW                       │
│                  (fills viewport)                   │
│                                                     │
│                                                  ┌──┤
│                                                  │🔍│
│                                                  ├──┤
│                                                  │❓│
│                                                  ├──┤
│                                                  │🏆│
│                                                  ├──┤
│                                                  │🗺️│
│                                                  └──┘
└─────────────────────────────────────────────────────┘
```

**Icon Dock**: Fixed right edge, vertically centered, 24px from edge

#### Mobile (<768px)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                                                     │
│                    GLOBE VIEW                       │
│                  (fills viewport)                   │
│                                                     │
│                                                     │
│                                                     │
│                                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
  ┌──┬──┬──┬──┐
  │🔍│❓│🏆│🗺️│
  └──┴──┴──┴──┘
```

**Icon Dock**: Fixed bottom edge, horizontally centered, 16px from edge

### Styling

#### Icon Buttons

```css
.icon-dock-button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(117, 189, 243, 0.3);
  box-shadow: 0 8px 24px rgba(86, 157, 214, 0.2);
  cursor: pointer;
  transition: all 150ms ease;
  display: grid;
  place-items: center;
  font-size: 24px;
}

.icon-dock-button:hover {
  background: rgba(255, 255, 255, 0.95);
  transform: scale(1.08);
  box-shadow: 0 12px 32px rgba(86, 157, 214, 0.3);
}

.icon-dock-button.active {
  background: rgba(255, 245, 177, 0.95);
  border-color: rgba(245, 185, 74, 0.5);
  box-shadow: 0 12px 32px rgba(245, 185, 74, 0.4);
}
```

#### Overlay Panels

```css
.overlay-panel {
  position: fixed;
  top: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  border-left: 1px solid rgba(117, 189, 243, 0.2);
  box-shadow: -8px 0 48px rgba(86, 157, 214, 0.2);
  z-index: 100;
  overflow-y: auto;
  transition: transform 200ms ease-out;
}

.overlay-panel.from-right {
  right: 0;
  width: 480px;
  transform: translateX(100%);
}

.overlay-panel.from-right.open {
  transform: translateX(0);
}

.overlay-panel.from-left {
  left: 0;
  width: 360px;
  transform: translateX(-100%);
}

.overlay-panel.from-left.open {
  transform: translateX(0);
}

.overlay-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 99;
  opacity: 0;
  transition: opacity 200ms ease-out;
  pointer-events: none;
}

.overlay-backdrop.visible {
  opacity: 1;
  pointer-events: auto;
}

@media (max-width: 767px) {
  .overlay-panel.from-right,
  .overlay-panel.from-left {
    width: 85%;
  }
}
```

#### Globe Container

```css
.globe-container {
  position: fixed;
  inset: 0;
  z-index: 1;
}

.globe-stage {
  width: 100vw;
  height: 100vh;
  border-radius: 0; /* Remove border-radius for full-screen */
}
```

### Animations

#### Icon Hover

- Scale: 1.0 → 1.08
- Shadow: subtle → prominent
- Duration: 150ms ease

#### Overlay Open/Close

- Transform: translateX(100%) → translateX(0)
- Backdrop opacity: 0 → 1
- Duration: 200ms ease-out

#### Active Icon Pulse (optional enhancement)

```css
@keyframes pulse-active {
  0%, 100% { box-shadow: 0 12px 32px rgba(245, 185, 74, 0.4); }
  50% { box-shadow: 0 12px 32px rgba(245, 185, 74, 0.6); }
}

.icon-dock-button.active {
  animation: pulse-active 2s ease-in-out infinite;
}
```

### Color Palette

Reuse existing CSS custom properties:

- **Primary Accent**: `var(--theme-accent)` — #58cc02
- **Text**: `var(--ink)` — #21425f
- **Muted Text**: `var(--muted)` — #5b7f9e
- **Surface**: `var(--surface)` — rgba(255, 255, 255, 0.92)
- **Border**: `var(--border)` — rgba(79, 156, 223, 0.16)
- **Shadow**: `var(--shadow)` — 0 20px 50px rgba(73, 129, 186, 0.16)

**New additions for icons:**
- **Icon Background**: rgba(255, 255, 255, 0.85)
- **Icon Active**: rgba(255, 245, 177, 0.95)
- **Backdrop**: rgba(0, 0, 0, 0.3)

---

## Error Handling

### No Country Selected

**Scenario**: User clicks Realm Overview icon before selecting a country

**Behavior**: `RealmOverviewPanel` renders `CountrySkillsPanel` with `country={null}`, which displays:
```
"Job Kingdom"
"Pick a realm."
```

**No error thrown.** Existing empty-state handling is preserved.

### No State Selected

**Scenario**: User clicks Realm Overview icon with a country selected but no state selected

**Behavior**: `StatePathwayPanel` renders with `stateDetails={null}`, which displays:
```
"Mission Pathway"
"Open a province."
```

**No error thrown.** Existing empty-state handling is preserved.

### Search with No Results

**Scenario**: User types a search query that matches no realms

**Behavior**: `SearchPanel` displays:
```
"No realms found matching '{query}'"
```

**Implementation**:
```javascript
const filteredCountries = countryMetrics.filter(c => 
  c.title.toLowerCase().includes(searchQuery.toLowerCase())
);

{filteredCountries.length === 0 && searchQuery && (
  <p className="muted">No realms found matching '{searchQuery}'</p>
)}
```

### Keyboard Navigation

**Escape Key**: Close active overlay

**Implementation**:
```javascript
useEffect(() => {
  function handleEscape(e) {
    if (e.key === 'Escape' && activeOverlay) {
      setActiveOverlay(null);
    }
  }
  window.addEventListener('keydown', handleEscape);
  return () => window.removeEventListener('keydown', handleEscape);
}, [activeOverlay]);
```

---

## Testing Strategy

### Unit Tests

**Focus**: Component rendering, state transitions, event handlers

**Test Cases**:

1. **IconDock**:
   - Renders four icon buttons
   - Applies `active` class to correct button
   - Calls `onIconClick` with correct overlay name

2. **SearchPanel**:
   - Filters countries by search query (case-insensitive)
   - Auto-focuses input when opened
   - Calls `onCountrySelect` when country card is clicked
   - Calls `onClose` when close button is clicked

3. **HelpPanel**:
   - Renders "How It Works" content
   - Displays locked regions from `LOCKED_WORLD_REGIONS`
   - Calls `onClose` when close button is clicked

4. **LeaderboardPanel**:
   - Displays level, XP, streak, prestige tier, total realms
   - Calls `onClose` when close button is clicked

5. **RealmOverviewPanel**:
   - Renders `CountrySkillsPanel` with correct props
   - Renders `StatePathwayPanel` with correct props
   - Handles null country/state gracefully

6. **WorldLobby**:
   - Opens correct overlay when icon is clicked
   - Closes overlay when Escape is pressed
   - Closes current overlay and opens new one when different icon is clicked
   - Toggles overlay when same icon is clicked twice

### Integration Tests

**Focus**: End-to-end user flows

**Test Cases**:

1. **Search and Select Realm**:
   - Click Search icon → SearchPanel opens
   - Type "India" → List filters to India
   - Click India card → `onCountrySelect` called, new window opens

2. **View Help**:
   - Click Help icon → HelpPanel opens
   - Verify "How It Works" content is visible
   - Press Escape → HelpPanel closes

3. **View Leaderboard**:
   - Click Leaderboard icon → LeaderboardPanel opens
   - Verify player stats are displayed
   - Click close button → LeaderboardPanel closes

4. **View Realm Overview**:
   - Select a country on globe
   - Click Realm Overview icon → RealmOverviewPanel opens
   - Verify `CountrySkillsPanel` shows selected country
   - Click a state → Verify `StatePathwayPanel` updates

5. **Switch Overlays**:
   - Click Search icon → SearchPanel opens
   - Click Help icon → SearchPanel closes, HelpPanel opens
   - Click Help icon again → HelpPanel closes

### Manual Testing

**Focus**: Visual polish, animations, responsiveness

**Test Cases**:

1. **Icon Hover States**:
   - Hover over each icon → Verify scale and shadow transition
   - Verify active icon has distinct visual state

2. **Overlay Animations**:
   - Open each overlay → Verify 200ms slide-in animation
   - Close each overlay → Verify 200ms slide-out animation
   - Verify backdrop fades in/out smoothly

3. **Responsive Behavior**:
   - Resize viewport to <768px → Verify icon dock moves to bottom
   - Open overlay on mobile → Verify 85% width constraint
   - Verify globe canvas resizes correctly

4. **Globe Interaction**:
   - Drag globe → Verify rotation works with overlay open
   - Click country label → Verify new window opens
   - Verify auto-rotation continues when not dragging

5. **Keyboard Navigation**:
   - Open overlay → Press Escape → Verify overlay closes
   - Verify focus management (input auto-focus in SearchPanel)

---

## Implementation Approach

### Phase 1: Layout Restructure

**Goal**: Remove existing header/sidebar, make globe fill viewport

**Tasks**:
1. Modify `WorldLobby` component:
   - Remove `<header className="hero-shell">` from render
   - Remove `<section className="mission-strip">` from render
   - Remove `<main className="layout">` wrapper
   - Wrap `<GlobeView>` in `<div className="globe-container">`
2. Update CSS:
   - Add `.globe-container { position: fixed; inset: 0; z-index: 1; }`
   - Update `.globe-stage` to remove border-radius, set width/height to 100vw/100vh
3. Verify globe fills viewport and remains interactive

### Phase 2: Icon Dock

**Goal**: Add persistent icon buttons

**Tasks**:
1. Create `IconDock.jsx` component:
   - Accept `activeOverlay` and `onIconClick` props
   - Render four icon buttons with Unicode symbols
   - Apply `active` class based on `activeOverlay`
2. Add `IconDock` to `WorldLobby` render (after `GlobeView`)
3. Add CSS for `.icon-dock`, `.icon-dock-button`, hover/active states
4. Add responsive media query for mobile layout
5. Verify icons are visible, clickable, and styled correctly

### Phase 3: Overlay Infrastructure

**Goal**: Add overlay state management and backdrop

**Tasks**:
1. Add `activeOverlay` state to `WorldLobby`:
   ```javascript
   const [activeOverlay, setActiveOverlay] = useState(null);
   ```
2. Add Escape key handler:
   ```javascript
   useEffect(() => {
     function handleEscape(e) {
       if (e.key === 'Escape' && activeOverlay) {
         setActiveOverlay(null);
       }
     }
     window.addEventListener('keydown', handleEscape);
     return () => window.removeEventListener('keydown', handleEscape);
   }, [activeOverlay]);
   ```
3. Create `OverlayBackdrop.jsx` component:
   - Render backdrop div with `onClick={() => onClose()}`
   - Apply `visible` class when `isVisible` prop is true
4. Add CSS for `.overlay-backdrop`, `.overlay-panel` base styles
5. Verify backdrop appears/disappears with state changes

### Phase 4: SearchPanel

**Goal**: Implement realm search overlay

**Tasks**:
1. Create `SearchPanel.jsx` component:
   - Accept `isOpen`, `onClose`, `countryMetrics`, `onCountrySelect` props
   - Add `searchQuery` state
   - Filter countries by query
   - Render input and filtered list
   - Auto-focus input when `isOpen` becomes true
2. Add `SearchPanel` to `WorldLobby` render (conditionally based on `activeOverlay === 'search'`)
3. Add CSS for `.search-panel`, `.search-input`, `.search-results`
4. Verify search filters correctly, country selection works

### Phase 5: HelpPanel

**Goal**: Implement help/onboarding overlay

**Tasks**:
1. Create `HelpPanel.jsx` component:
   - Accept `isOpen`, `onClose` props
   - Render "How It Works" content
   - Display `LOCKED_WORLD_REGIONS`
2. Add `HelpPanel` to `WorldLobby` render (conditionally based on `activeOverlay === 'help'`)
3. Add CSS for `.help-panel`, `.help-content`
4. Verify content displays correctly

### Phase 6: LeaderboardPanel

**Goal**: Implement player stats overlay

**Tasks**:
1. Create `LeaderboardPanel.jsx` component:
   - Accept `isOpen`, `onClose`, `level`, `xp`, `streakCount`, `prestigeTier`, `totalRealms` props
   - Render stats grid
2. Add `LeaderboardPanel` to `WorldLobby` render (conditionally based on `activeOverlay === 'leaderboard'`)
3. Add CSS for `.leaderboard-panel`, `.stats-grid`
4. Verify stats display correctly from Zustand store

### Phase 7: RealmOverviewPanel

**Goal**: Implement realm details overlay

**Tasks**:
1. Create `RealmOverviewPanel.jsx` component:
   - Accept `isOpen`, `onClose`, and all props for `CountrySkillsPanel` and `StatePathwayPanel`
   - Render both existing components
2. Add `RealmOverviewPanel` to `WorldLobby` render (conditionally based on `activeOverlay === 'realm-overview'`)
3. Add CSS for `.realm-overview-panel`, scrollable content area
4. Verify existing components render correctly, scrolling works

### Phase 8: Polish and Testing

**Goal**: Refine animations, responsiveness, edge cases

**Tasks**:
1. Test all overlay transitions (open/close, switch)
2. Test responsive behavior (<768px)
3. Test keyboard navigation (Escape, Tab, Enter)
4. Test edge cases (no country selected, no search results)
5. Verify globe interaction preserved (drag, click, auto-rotate)
6. Add loading states if needed
7. Add accessibility attributes (aria-label, role, etc.)

---

## Accessibility Considerations

### Keyboard Navigation

- **Tab**: Navigate between icon buttons
- **Enter/Space**: Activate icon button
- **Escape**: Close active overlay
- **Tab (in overlay)**: Navigate between interactive elements

### ARIA Attributes

```jsx
<button
  className="icon-dock-button"
  aria-label="Search realms"
  aria-pressed={activeOverlay === 'search'}
  onClick={() => onIconClick('search')}
>
  🔍
</button>
```

### Focus Management

- Auto-focus search input when SearchPanel opens
- Return focus to icon button when overlay closes
- Trap focus within overlay when open (optional enhancement)

### Screen Reader Announcements

```jsx
<div role="status" aria-live="polite" className="sr-only">
  {activeOverlay && `${activeOverlay} panel opened`}
</div>
```

---

## Performance Considerations

### Globe Rendering

**No changes to Three.js rendering loop.** The globe continues to render at 60fps regardless of overlay state.

**Potential optimization**: Reduce globe animation complexity when overlay is open (e.g., pause auto-rotation). This is optional and not required for MVP.

### Overlay Rendering

**Conditional rendering**: Overlays are only mounted when `activeOverlay` matches their name. This prevents unnecessary DOM nodes and React reconciliation.

```jsx
{activeOverlay === 'search' && (
  <SearchPanel
    isOpen={true}
    onClose={() => setActiveOverlay(null)}
    countryMetrics={playableCountryMetrics}
    onCountrySelect={onCountrySelect}
  />
)}
```

**Alternative approach**: Mount all overlays but control visibility with CSS. This trades memory for faster transitions but is not recommended for this feature.

### Transition Performance

**Use CSS transforms** (translateX) instead of left/right for overlay animations. Transforms are GPU-accelerated and avoid layout thrashing.

**Use will-change** sparingly:
```css
.overlay-panel {
  will-change: transform;
}
```

Remove `will-change` after transition completes to free GPU memory.

---

## Migration Path

### Backward Compatibility

**No breaking changes.** All existing components, props, and data flow remain unchanged. The redesign is purely additive:

- New components: `IconDock`, `SearchPanel`, `HelpPanel`, `LeaderboardPanel`, `RealmOverviewPanel`, `OverlayBackdrop`
- Modified component: `WorldLobby` (layout restructure, new state)
- Unchanged components: `WorldMap`, `CountrySkillsPanel`, `StatePathwayPanel`

### Rollback Plan

If issues arise, revert `WorldLobby` to previous layout:

1. Remove `IconDock` and overlay components from render
2. Restore `<header>`, `<section className="mission-strip">`, `<main className="layout">` wrappers
3. Restore original CSS for `.globe-stage` (border-radius, fixed height)

All existing functionality will work immediately.

### Feature Flag (Optional)

Add a feature flag to toggle between old and new layouts:

```javascript
const GLOBE_FIRST_UI_ENABLED = true; // or read from env/config

return GLOBE_FIRST_UI_ENABLED ? (
  <GlobeFirstLayout />
) : (
  <TraditionalLayout />
);
```

This allows A/B testing or gradual rollout.

---

## Future Enhancements

### Phase 2 Features (Out of Scope for MVP)

1. **Customizable Icon Dock**:
   - Allow users to reorder icons
   - Add/remove icons based on preferences

2. **Overlay Resize**:
   - Draggable edge to resize overlay width
   - Remember user's preferred width in localStorage

3. **Multiple Overlays**:
   - Support two overlays open simultaneously (e.g., Search + Realm Overview)
   - Implement z-index stacking and focus management

4. **Overlay Minimize**:
   - Minimize overlay to icon badge without fully closing
   - Quick toggle between minimized and expanded states

5. **Globe Interaction Modes**:
   - "Focus Mode": Dim globe and pause rotation when overlay is open
   - "Explore Mode": Highlight countries matching search query on globe

6. **Keyboard Shortcuts**:
   - `Cmd+K` / `Ctrl+K`: Open search
   - `?`: Open help
   - `L`: Open leaderboard
   - `R`: Open realm overview

7. **Animations**:
   - Staggered icon entrance on page load
   - Particle effects when country is selected
   - Smooth camera zoom to selected country

---

## Conclusion

This design transforms SkillQuest's main lobby into an immersive globe-first experience while preserving all existing functionality. The implementation is purely additive—no backend changes, no state management changes, no modifications to existing components beyond layout restructure. The result is a modern, minimal UI that puts the 3D globe front and center, with all features accessible via four simple icons and smooth overlay transitions.

**Key Success Metrics**:
- Globe fills 100% viewport ✓
- Four icons visible at all times ✓
- All existing features accessible via overlays ✓
- No backend or state management changes ✓
- Smooth 200ms transitions ✓
- Responsive design (<768px) ✓
- Keyboard navigation (Escape) ✓

**Next Steps**:
1. Review and approve design document
2. Begin Phase 1 implementation (layout restructure)
3. Iterate through Phases 2-8
4. Conduct user testing and gather feedback
5. Polish and deploy to production
