import { useEffect, useMemo, useState } from 'react';
import { api } from './api/client';
import GlobeView from './components/WorldMap';
import CountrySkillsPanel from './components/CountrySkillsPanel';
import StatePathwayPanel from './components/StatePathwayPanel';
import CountryWindow from './components/CountryWindow';
import { getClusterTheme, isPlayableRealm, LOCKED_WORLD_REGIONS } from './data/worldConfig';

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
      window.open(url.toString(), '_blank', 'noopener,width=1480,height=940');
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

  return (
    <div
      className="app-root"
      style={{
        '--theme-accent': selectedTheme.accent,
        '--theme-glow': selectedTheme.glow,
        '--theme-atmosphere': selectedTheme.atmosphere,
      }}
    >
      <header className="hero-shell">
        <div className="hero-copy">
          <p className="eyebrow">SkillQuest</p>
          <h1>Open a realm. Learn by playing.</h1>
          <p className="hero-text">World window for cluster selection. Country maps open in their own game windows.</p>
        </div>

        <div className="hero-stats">
          <article className="stat-card">
            <span>Status</span>
            <strong>{health === 'ok' ? 'Online' : health}</strong>
          </article>
          <article className="stat-card">
            <span>Realms</span>
            <strong>{questStats.totalJobs}</strong>
          </article>
          <article className="stat-card">
            <span>Now Playing</span>
            <strong>{questStats.selectedCountryName}</strong>
          </article>
          <article className="stat-card">
            <span>Levels</span>
            <strong>{questStats.activeCities}</strong>
          </article>
        </div>
      </header>

      <section className="mission-strip">
        <article className="mission-card">
          <span>Theme</span>
          <strong>Asia campaign unlocked. Bigger nations hold the harder classes.</strong>
        </article>
        <article className="mission-card">
          <span>Provinces</span>
          <strong>{questStats.activeStates}</strong>
        </article>
        <article className="mission-card mission-card-accent">
          <span>Locked</span>
          <strong>{LOCKED_WORLD_REGIONS.join(' - ')}</strong>
        </article>
      </section>

      {loading && <div className="banner">Loading map...</div>}
      {!!error && <div className="banner error">{error}</div>}

      <main className="layout">
        <section className="map-panel">
          <div className="panel-heading">
            <h2>World Map</h2>
            <p className="muted">Asia is live. Other regions stay locked until later worlds unlock.</p>
          </div>
          <GlobeView
            countryMetrics={playableCountryMetrics}
            selectedCountryId={selectedCountry?.id || ''}
            onCountrySelect={onCountrySelect}
          />
        </section>

        <section className="side-panel">
          <CountrySkillsPanel
            country={selectedCountry}
            roleDetails={roleDetails}
            statesMeta={statesMeta}
            selectedStateId={selectedStateId}
            onStateSelect={onStateSelect}
          />
          <StatePathwayPanel stateDetails={stateDetails} />
        </section>
      </main>
    </div>
  );
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const windowMode = params.get('window');
  const countryId = params.get('country');

  if (windowMode === 'country' && countryId) {
    return <CountryWindow countryId={countryId} />;
  }

  return <WorldLobby />;
}
