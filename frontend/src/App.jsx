import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api/client';
import GlobeView from './components/WorldMap';
import CountrySkillsPanel from './components/CountrySkillsPanel';
import StatePathwayPanel from './components/StatePathwayPanel';
import CountryWindow from './components/CountryWindow';
import AssessmentRouteWindow from './components/AssessmentRouteWindow';
import IconDock from './components/IconDock';
import OverlayBackdrop from './components/OverlayBackdrop';
import SearchPanel from './components/SearchPanel';
import HelpPanel from './components/HelpPanel';
import LeaderboardPanel from './components/LeaderboardPanel';
import RealmOverviewPanel from './components/RealmOverviewPanel';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import { getClusterTheme, isPlayableRealm, LOCKED_WORLD_REGIONS } from './data/worldConfig';
import { useAuthStore } from './store/authStore';
import { usePlayerStore } from './store/playerStore';

const LEVEL_WEIGHT = {
  beginner: 1,
  intermediate: 1.6,
  advanced: 2.3,
  optional: 0.8,
};

function buildCountryMetrics(continents, roleById, stateById) {
  return continents.flatMap((continent) =>
    continent.countries.map((country) => {
      const role = roleById.get(country.id);
      const requirements = role?.state_requirements || [];
      const complexity = requirements.reduce((sum, req) => {
        const weight = LEVEL_WEIGHT[req.expected_level] || 1;
        const nodeCount = stateById.get(req.state_id)?.nodes?.length || 1;
        return sum + weight * nodeCount;
      }, 0);

      return {
        ...country,
        continentId: continent.id,
        complexity,
        questCount: requirements.length,
      };
    })
  );
}

function buildQuestStats(countryMetrics, selectedCountry, roleDetails, stateDetails) {
  return {
    totalJobs: countryMetrics.length,
    activeStates: roleDetails?.state_requirements?.length || 0,
    activeCities: stateDetails?.nodes?.length || 0,
    selectedCountryName: selectedCountry?.title || 'Pick a realm',
  };
}

function getPrestigeTier(level) {
  if (level >= 15) return 'Legend';
  if (level >= 11) return 'Architect';
  if (level >= 7) return 'Expert';
  if (level >= 4) return 'Journeyman';
  return 'Apprentice';
}

function useBootstrapData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [health, setHealth] = useState('unknown');
  const [continents, setContinents] = useState([]);
  const [states, setStates] = useState([]);
  const [roleById, setRoleById] = useState(new Map());
  const [stateById, setStateById] = useState(new Map());

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      setError('');
      try {
        const [h, wm, st] = await Promise.all([api.health(), api.worldMap(), api.states()]);
        setHealth(h.status);
        setContinents(wm.continents || []);
        setStates(st.states || []);

        const countries = (wm.continents || []).flatMap((continent) => continent.countries || []);
        const [roleEntries, stateEntries] = await Promise.all([
          Promise.all(countries.map(async (country) => [country.id, await api.roleDetails(country.id)])),
          Promise.all((st.states || []).map(async (state) => [state.state_id, await api.stateDetails(state.state_id)])),
        ]);

        setRoleById(new Map(roleEntries));
        setStateById(new Map(stateEntries));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  return { loading, error, health, continents, states, roleById, stateById };
}

function WorldLobby() {
  const { loading, error, health, continents, states, roleById, stateById } = useBootstrapData();
  const [selectedContinentId, setSelectedContinentId] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [roleDetails, setRoleDetails] = useState(null);
  const [selectedStateId, setSelectedStateId] = useState('');
  const [stateDetails, setStateDetails] = useState(null);
  const [activeOverlay, setActiveOverlay] = useState(null);
  const [renderedOverlay, setRenderedOverlay] = useState(null);
  const level = usePlayerStore((state) => state.level);
  const xp = usePlayerStore((state) => state.xp);
  const streakCount = usePlayerStore((state) => state.streakCount);
  const closeTimeoutRef = useRef(0);
  const lastOverlayButtonRef = useRef(null);

  const statesMeta = useMemo(() => new Map(states.map((s) => [s.state_id, s])), [states]);
  const countryMetrics = useMemo(
    () => buildCountryMetrics(continents, roleById, stateById),
    [continents, roleById, stateById]
  );
  const playableCountryMetrics = useMemo(
    () => countryMetrics.filter((country) => isPlayableRealm(country.id)),
    [countryMetrics]
  );
  const questStats = useMemo(
    () => buildQuestStats(playableCountryMetrics, selectedCountry, roleDetails, stateDetails),
    [playableCountryMetrics, selectedCountry, roleDetails, stateDetails]
  );
  const selectedTheme = getClusterTheme(selectedContinentId || playableCountryMetrics[0]?.continentId || 'ai_data');
  const prestigeTier = getPrestigeTier(level);

  async function onCountrySelect(continentId, country) {
    setSelectedContinentId(continentId);
    setSelectedCountry(country);
    setSelectedStateId('');
    setStateDetails(null);
    try {
      const role = roleById.get(country.id) || (await api.roleDetails(country.id));
      setRoleDetails(role);
      const url = new URL(window.location.href);
      url.searchParams.set('window', 'country');
      url.searchParams.set('country', country.id);
      window.open(url.toString(), '_blank', 'noopener');
    } catch (e) {
      console.error(e);
    }
  }

  async function onStateSelect(stateId) {
    setSelectedStateId(stateId);
    try {
      setStateDetails(stateById.get(stateId) || (await api.stateDetails(stateId)));
    } catch (e) {
      console.error(e);
    }
  }

  function focusLastOverlayButton() {
    window.requestAnimationFrame(() => {
      lastOverlayButtonRef.current?.focus();
    });
  }

  function closeOverlay() {
    if (!renderedOverlay) return;
    window.clearTimeout(closeTimeoutRef.current);
    setActiveOverlay(null);
    closeTimeoutRef.current = window.setTimeout(() => {
      setRenderedOverlay(null);
      focusLastOverlayButton();
    }, 220);
  }

  function handleOverlayToggle(nextOverlay, buttonNode) {
    if (buttonNode) {
      lastOverlayButtonRef.current = buttonNode;
    }

    window.clearTimeout(closeTimeoutRef.current);

    if (activeOverlay === nextOverlay) {
      closeOverlay();
      return;
    }

    setActiveOverlay(null);
    setRenderedOverlay(nextOverlay);
    window.requestAnimationFrame(() => {
      setActiveOverlay(nextOverlay);
    });
  }

  useEffect(() => {
    function handleEscape(e) {
      if (e.key === 'Escape' && activeOverlay) {
        closeOverlay();
      }
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [activeOverlay]);

  useEffect(() => () => window.clearTimeout(closeTimeoutRef.current), []);

  return (
    <div
      className="app-root"
      style={{
        '--theme-accent': selectedTheme.accent,
        '--theme-glow': selectedTheme.glow,
        '--theme-atmosphere': selectedTheme.atmosphere,
      }}
    >
      {loading && <div className="banner">Loading world lobby...</div>}
      {!!error && <div className="banner error">{error}</div>}

      <div className="globe-container">
        <GlobeView
          countryMetrics={playableCountryMetrics}
          selectedCountryId={selectedCountry?.id || ''}
          onCountrySelect={onCountrySelect}
        />
      </div>

      <IconDock activeOverlay={activeOverlay} onIconClick={handleOverlayToggle} />

      {renderedOverlay && <OverlayBackdrop isVisible={Boolean(activeOverlay)} onClose={closeOverlay} />}

      {renderedOverlay === 'search' && (
        <SearchPanel
          isOpen={activeOverlay === 'search'}
          onClose={closeOverlay}
          countryMetrics={playableCountryMetrics}
          onCountrySelect={onCountrySelect}
        />
      )}

      {renderedOverlay === 'help' && (
        <HelpPanel
          isOpen={activeOverlay === 'help'}
          onClose={closeOverlay}
          lockedRegions={LOCKED_WORLD_REGIONS}
        />
      )}

      {renderedOverlay === 'leaderboard' && (
        <LeaderboardPanel
          isOpen={activeOverlay === 'leaderboard'}
          onClose={closeOverlay}
          level={level}
          xp={xp}
          streakCount={streakCount}
          prestigeTier={prestigeTier}
          totalRealms={playableCountryMetrics.length}
        />
      )}

      {renderedOverlay === 'realm-overview' && (
        <RealmOverviewPanel
          isOpen={activeOverlay === 'realm-overview'}
          onClose={closeOverlay}
          country={selectedCountry}
          roleDetails={roleDetails}
          statesMeta={statesMeta}
          selectedStateId={selectedStateId}
          onStateSelect={onStateSelect}
          stateDetails={stateDetails}
        />
      )}
    </div>
  );
}

export default function App() {
  const [search, setSearch] = useState(() => window.location.search);
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const authToken = useAuthStore((state) => state.token);
  const authUser = useAuthStore((state) => state.user);
  const authInitialized = useAuthStore((state) => state.initialized);
  const authStatus = useAuthStore((state) => state.status);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const markAuthInitialized = useAuthStore((state) => state.markInitialized);
  const setUsername = usePlayerStore((state) => state.setUsername);
  const setAvatar = usePlayerStore((state) => state.setAvatar);

  useEffect(() => {
    function handleLocationChange() {
      setSearch(window.location.search);
    }

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapAuth() {
      if (!authToken) {
        markAuthInitialized();
        return;
      }

      try {
        const response = await api.me();
        if (!isMounted) return;
        setSession({ token: authToken, user: response.user });
        setUsername(response.user.username);
        setAvatar(response.user.username?.[0] || response.user.full_name?.[0] || 'Q');
      } catch (error) {
        if (!isMounted) return;
        clearSession();
      }
    }

    bootstrapAuth();
    return () => {
      isMounted = false;
    };
  }, [authToken, clearSession, markAuthInitialized, setAvatar, setSession, setUsername]);

  const params = new URLSearchParams(search);
  const windowMode = params.get('window');
  const countryId = params.get('country');
  const stateId = params.get('state');
  const view = params.get('view');

  function updateView(nextView, options = {}) {
    const nextParams = new URLSearchParams(window.location.search);
    if (nextView) {
      nextParams.set('view', nextView);
    } else {
      nextParams.delete('view');
    }
    if (options.resetWindowParams) {
      nextParams.delete('window');
      nextParams.delete('country');
      nextParams.delete('state');
    }
    const query = nextParams.toString();
    window.history.pushState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
    setSearch(window.location.search);
  }

  function openLogin() {
    setAuthError('');
    updateView('login', { resetWindowParams: true });
  }

  function openSignup() {
    setAuthError('');
    updateView('signup', { resetWindowParams: true });
  }

  function openHome() {
    setAuthError('');
    updateView('', { resetWindowParams: true });
  }

  async function handleAuthSubmit(payload) {
    setAuthBusy(true);
    setAuthError('');
    try {
      const response = view === 'signup' ? await api.signup(payload) : await api.login(payload);
      setSession({ token: response.token, user: response.user });
      setUsername(response.user.username);
      setAvatar(response.user.username?.[0] || response.user.full_name?.[0] || 'Q');
      updateView('lobby', { resetWindowParams: true });
    } catch (error) {
      setAuthError(error.message.replace(/^Error:\s*/, ''));
    } finally {
      setAuthBusy(false);
    }
  }

  const isAuthenticated = authStatus === 'authenticated' && Boolean(authUser);
  const wantsAuthPage = view === 'login' || view === 'signup';
  const needsAuthGate =
    !isAuthenticated && (wantsAuthPage || view === 'lobby' || windowMode === 'country' || windowMode === 'assessment');

  useEffect(() => {
    const shouldUseLandingMode = !needsAuthGate && view !== 'lobby' && !windowMode;
    document.body.classList.toggle('landing-mode', shouldUseLandingMode);

    return () => {
      document.body.classList.remove('landing-mode');
    };
  }, [needsAuthGate, view, windowMode]);

  if (!authInitialized) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-card">Restoring your SkillQuest session...</div>
      </div>
    );
  }

  if (needsAuthGate) {
    return (
      <AuthPage
        mode={view === 'signup' ? 'signup' : 'login'}
        onSubmit={handleAuthSubmit}
        onSwitchMode={() => (view === 'signup' ? openLogin() : openSignup())}
        onBackHome={openHome}
        isBusy={authBusy}
        serverError={authError}
      />
    );
  }

  if (windowMode === 'country' && countryId) {
    return <CountryWindow countryId={countryId} />;
  }

  if (windowMode === 'assessment' && countryId && stateId) {
    return <AssessmentRouteWindow countryId={countryId} stateId={stateId} />;
  }

  if (view !== 'lobby') {
    return <LandingPage onLogin={openLogin} onSignup={openSignup} />;
  }

  return <WorldLobby />;
}
