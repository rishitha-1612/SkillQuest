# Implementation Plan: Globe-First UI

## Overview

This implementation transforms the SkillQuest main lobby from a traditional multi-panel layout into an immersive globe-first experience. The 3D globe will fill the entire viewport with four minimal icon buttons providing access to existing features via overlay panels. This is a pure UI redesign with no backend logic, API calls, or state management changes.

The implementation follows an 8-phase approach: layout restructure, icon dock, overlay infrastructure, and four feature panels (Search, Help, Leaderboard, Realm Overview), concluding with polish and testing.

## Tasks

- [~] 1. Phase 1: Layout Restructure — Remove header/sidebar, globe fills viewport
  - [x] 1.1 Modify WorldLobby component to remove existing UI chrome
    - Remove `<header className="hero-shell">` from render
    - Remove `<section className="mission-strip">` from render
    - Remove `<main className="layout">` wrapper
    - Wrap `<GlobeView>` in `<div className="globe-container">`
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 1.2 Update CSS for full-viewport globe
    - Add `.globe-container { position: fixed; inset: 0; z-index: 1; }`
    - Update `.globe-stage` to remove border-radius
    - Set `.globe-stage` width/height to 100vw/100vh
    - Update `.globe-stage canvas` to match viewport dimensions
    - _Requirements: 1.1, 1.3_
  
  - [ ] 1.3 Verify globe fills viewport and remains interactive
    - Test globe rotation with drag
    - Test country label clicks
    - Test auto-rotation animation
    - Verify no visual regressions
    - _Requirements: 1.1, 1.4, 9.1, 9.2, 9.3_

- [~] 2. Phase 2: Icon Dock — Four persistent icon buttons
  - [x] 2.1 Create IconDock component
    - Create `frontend/src/components/IconDock.jsx`
    - Accept `activeOverlay` and `onIconClick` props
    - Render four icon buttons: Search (🔍), Help (❓), Leaderboard (🏆), Realm Overview (🗺️)
    - Apply `active` class to button matching `activeOverlay`
    - Call `onIconClick(overlayName)` on button click
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.5_
  
  - [x] 2.2 Add CSS for icon dock styling
    - Add `.icon-dock` container styles (fixed positioning)
    - Add `.icon-dock-button` styles (56px circular buttons)
    - Add semi-transparent frosted-glass background (rgba(255, 255, 255, 0.85))
    - Add hover effects (scale 1.08, enhanced shadow, 150ms transition)
    - Add active state styles (yellow background, accent border)
    - Position dock on right edge (desktop), bottom edge (mobile <768px)
    - _Requirements: 2.2, 2.3, 3.2, 3.3, 3.4, 3.5, 10.1_
  
  - [x] 2.3 Integrate IconDock into WorldLobby
    - Add `activeOverlay` state: `useState(null)`
    - Add `setActiveOverlay` handler function
    - Render `<IconDock>` after `<GlobeView>` with props
    - _Requirements: 2.2, 2.4, 2.5_
  
  - [ ] 2.4 Verify icon dock visibility and interactions
    - Test icons are visible over globe
    - Test hover effects on each icon
    - Test click handlers fire correctly
    - Test active state visual feedback
    - Test responsive layout on mobile (<768px)
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 3.3, 3.5, 10.1_

- [~] 3. Phase 3: Overlay Infrastructure — State management and backdrop
  - [x] 3.1 Add overlay state management to WorldLobby
    - Add Escape key handler to close active overlay
    - Add `useEffect` hook for keyboard event listener
    - Clean up event listener on unmount
    - _Requirements: 4.7_
  
  - [x] 3.2 Create OverlayBackdrop component
    - Create `frontend/src/components/OverlayBackdrop.jsx`
    - Accept `isVisible` and `onClose` props
    - Render backdrop div with click handler calling `onClose()`
    - Apply `visible` class when `isVisible` is true
    - _Requirements: 4.2, 4.6_
  
  - [x] 3.3 Add CSS for overlay infrastructure
    - Add `.overlay-backdrop` styles (fixed inset, rgba(0,0,0,0.3), z-index 99)
    - Add `.overlay-backdrop.visible` opacity transition (200ms ease-out)
    - Add `.overlay-panel` base styles (fixed positioning, z-index 100)
    - Add `.overlay-panel.from-right` and `.overlay-panel.from-left` slide animations
    - Add `.overlay-panel.open` transform transitions (translateX, 200ms ease-out)
    - Add responsive width constraints (85% on mobile <768px)
    - _Requirements: 4.2, 4.6, 10.2_
  
  - [ ] 3.4 Verify overlay infrastructure
    - Test Escape key closes overlay
    - Test backdrop click closes overlay
    - Test backdrop fade-in/fade-out animation
    - Test overlay slide-in/slide-out animation (200ms)
    - _Requirements: 4.6, 4.7_

- [~] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [~] 5. Phase 4: SearchPanel — Realm search overlay
  - [x] 5.1 Create SearchPanel component
    - Create `frontend/src/components/SearchPanel.jsx`
    - Accept `isOpen`, `onClose`, `countryMetrics`, `onCountrySelect` props
    - Add `searchQuery` state with `useState('')`
    - Render text input with auto-focus when `isOpen` becomes true
    - Filter `countryMetrics` by case-insensitive title match
    - Render filtered list as clickable cards
    - Call `onCountrySelect(country.continentId, country)` on card click
    - Call `onClose()` on close button click
    - Display "No realms found matching '{query}'" when no results
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [x] 5.2 Add CSS for SearchPanel
    - Add `.search-panel` styles (side drawer from right, 400px width desktop)
    - Add `.search-input` styles (text input with border, padding, focus state)
    - Add `.search-results` styles (scrollable list, gap between cards)
    - Add `.search-card` styles (clickable card with hover effect)
    - Add responsive width (85% on mobile <768px)
    - _Requirements: 5.1, 10.2_
  
  - [x] 5.3 Integrate SearchPanel into WorldLobby
    - Conditionally render `<SearchPanel>` when `activeOverlay === 'search'`
    - Pass `isOpen={true}`, `onClose={() => setActiveOverlay(null)}`, `countryMetrics={playableCountryMetrics}`, `onCountrySelect={onCountrySelect}`
    - _Requirements: 5.1, 5.3_
  
  - [ ] 5.4 Verify SearchPanel functionality
    - Test input auto-focuses when panel opens
    - Test search filters countries correctly (case-insensitive)
    - Test country card click calls `onCountrySelect`
    - Test close button closes panel
    - Test "no results" message displays correctly
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [~] 6. Phase 5: HelpPanel — Onboarding and instructions overlay
  - [x] 6.1 Create HelpPanel component
    - Create `frontend/src/components/HelpPanel.jsx`
    - Accept `isOpen` and `onClose` props
    - Render "How It Works" title
    - Render instructional content: "Learn, play, and clear boss battles."
    - Render three-step loop explanation
    - Display locked regions from `LOCKED_WORLD_REGIONS`
    - Add close button calling `onClose()`
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 6.2 Add CSS for HelpPanel
    - Add `.help-panel` styles (modal centered, max-width 600px)
    - Add `.help-content` styles (padding, line-height, readable text)
    - Add fade-in animation (200ms ease-out)
    - _Requirements: 6.1_
  
  - [x] 6.3 Integrate HelpPanel into WorldLobby
    - Import `LOCKED_WORLD_REGIONS` from worldConfig
    - Conditionally render `<HelpPanel>` when `activeOverlay === 'help'`
    - Pass `isOpen={true}`, `onClose={() => setActiveOverlay(null)}`
    - _Requirements: 6.1, 6.3_
  
  - [ ] 6.4 Verify HelpPanel content and behavior
    - Test "How It Works" content displays correctly
    - Test locked regions list displays correctly
    - Test close button closes panel
    - Test Escape key closes panel
    - _Requirements: 6.1, 6.2, 6.3_

- [~] 7. Phase 6: LeaderboardPanel — Player stats overlay
  - [x] 7.1 Create LeaderboardPanel component
    - Create `frontend/src/components/LeaderboardPanel.jsx`
    - Accept `isOpen`, `onClose`, `level`, `xp`, `streakCount`, `prestigeTier`, `totalRealms` props
    - Render stats grid with Level, XP, Rank, Streak, Total Realms
    - Add close button calling `onClose()`
    - _Requirements: 7.1, 7.2_
  
  - [x] 7.2 Add CSS for LeaderboardPanel
    - Add `.leaderboard-panel` styles (side drawer from left, 360px width desktop)
    - Add `.stats-grid` styles (grid layout, gap between stat cards)
    - Add `.stat-card` styles (card with label and value)
    - Add responsive width (85% on mobile <768px)
    - _Requirements: 7.1, 10.2_
  
  - [x] 7.3 Integrate LeaderboardPanel into WorldLobby
    - Get player stats from `usePlayerStore`: level, xp, streakCount
    - Calculate `prestigeTier` using existing `getPrestigeTier(level)` function
    - Calculate `totalRealms` from `playableCountryMetrics.length`
    - Conditionally render `<LeaderboardPanel>` when `activeOverlay === 'leaderboard'`
    - Pass all required props including stats
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ] 7.4 Verify LeaderboardPanel displays correct stats
    - Test Level displays from Zustand store
    - Test XP displays from Zustand store
    - Test Streak displays from Zustand store
    - Test Rank (prestige tier) calculates correctly
    - Test Total Realms counts playable countries
    - Test close button closes panel
    - _Requirements: 7.1, 7.2, 7.3_

- [~] 8. Phase 7: RealmOverviewPanel — Selected realm details overlay
  - [x] 8.1 Create RealmOverviewPanel component
    - Create `frontend/src/components/RealmOverviewPanel.jsx`
    - Accept `isOpen`, `onClose`, `country`, `roleDetails`, `statesMeta`, `selectedStateId`, `onStateSelect`, `stateDetails` props
    - Render `<CountrySkillsPanel>` with existing props (country, roleDetails, statesMeta, selectedStateId, onStateSelect)
    - Render `<StatePathwayPanel>` with existing props (stateDetails)
    - Add scrollable content area for overflow
    - Add close button calling `onClose()`
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [x] 8.2 Add CSS for RealmOverviewPanel
    - Add `.realm-overview-panel` styles (side drawer from right, 480px width desktop)
    - Add scrollable content area styles (overflow-y: auto)
    - Add responsive width (85% on mobile <768px)
    - _Requirements: 8.1, 10.2_
  
  - [x] 8.3 Integrate RealmOverviewPanel into WorldLobby
    - Conditionally render `<RealmOverviewPanel>` when `activeOverlay === 'realm-overview'`
    - Pass all required props: isOpen, onClose, country, roleDetails, statesMeta, selectedStateId, onStateSelect, stateDetails
    - _Requirements: 8.1, 8.2_
  
  - [ ] 8.4 Verify RealmOverviewPanel renders existing components
    - Test `CountrySkillsPanel` renders with correct props
    - Test `StatePathwayPanel` renders with correct props
    - Test empty state displays "Pick a realm." when no country selected
    - Test scrolling works when content exceeds viewport height
    - Test close button closes panel
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [~] 9. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [~] 10. Phase 8: Polish and Testing — Refine animations, responsiveness, edge cases
  - [~] 10.1 Test and refine overlay transitions
    - Verify all overlays slide in/out smoothly (200ms)
    - Verify backdrop fades in/out smoothly (200ms)
    - Verify no visual glitches during transitions
    - Test switching between overlays (close current, open new)
    - Test toggling same overlay (open → close → open)
    - _Requirements: 4.6_
  
  - [~] 10.2 Test responsive behavior on mobile viewports
    - Test icon dock repositions to bottom on <768px
    - Test overlay panels resize to 85% width on <768px
    - Test globe canvas resizes correctly on window resize
    - Test all interactions work on touch devices
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [~] 10.3 Test keyboard navigation and accessibility
    - Test Tab key navigates between icon buttons
    - Test Enter/Space activates icon buttons
    - Test Escape key closes active overlay
    - Test focus returns to icon button after overlay closes
    - Add aria-label attributes to icon buttons
    - Add aria-pressed attributes to icon buttons
    - _Requirements: 4.7_
  
  - [~] 10.4 Test edge cases and error states
    - Test Realm Overview panel with no country selected (displays "Pick a realm.")
    - Test Realm Overview panel with country but no state selected
    - Test Search panel with no matching results
    - Test globe interaction preserved with overlay open
    - Test country label clicks still open new windows
    - _Requirements: 8.3, 9.1, 9.2, 9.3, 9.4_
  
  - [~] 10.5 Verify no backend or state management changes
    - Verify no new API calls added
    - Verify no Zustand store actions modified
    - Verify `WorldMap.jsx` props unchanged
    - Verify `CountrySkillsPanel.jsx` props unchanged
    - Verify `StatePathwayPanel.jsx` props unchanged
    - Verify `useBootstrapData` hook unchanged
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [ ] 10.6 Final visual polish and consistency check
    - Verify icon colors match theme (--theme-accent, --ink, --muted)
    - Verify overlay backgrounds use consistent frosted-glass effect
    - Verify all animations feel smooth and natural
    - Verify text is readable on all backgrounds
    - Verify spacing and padding are consistent
    - _Requirements: 3.4_

- [~] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- No property-based tests are included (this is a UI-only feature with no universal correctness properties)
- Unit tests validate component rendering, state transitions, and event handlers
- Integration tests validate end-to-end user flows
- Manual testing validates visual polish, animations, and responsiveness
- All existing components (`WorldMap`, `CountrySkillsPanel`, `StatePathwayPanel`) are reused without modification
- No backend logic, API calls, or Zustand store changes are required
