import { useEffect, useMemo, useState } from 'react';
import { api } from './api/client';
import GlobeView from './components/WorldMap';
import CountrySkillsPanel from './components/CountrySkillsPanel';
import StatePathwayPanel from './components/StatePathwayPanel';

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
      };
    })
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [health, setHealth] = useState('unknown');
  const [continents, setContinents] = useState([]);
  const [states, setStates] = useState([]);
  const [roleById, setRoleById] = useState(new Map());
  const [stateById, setStateById] = useState(new Map());

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

  async function onCountrySelect(continentId, country) {
    setSelectedContinentId(continentId);
    setSelectedCountry(country);
    setSelectedStateId('');
    setStateDetails(null);
    try {
      const role = roleById.get(country.id) || (await api.roleDetails(country.id));
      setRoleDetails(role);
    } catch (e) {
      setError(e.message);
    }
  }

  function onBackToGlobe() {
    setSelectedContinentId('');
    setSelectedCountry(null);
    setRoleDetails(null);
    setSelectedStateId('');
    setStateDetails(null);
  }

  function onBackToCountry() {
    setSelectedStateId('');
    setStateDetails(null);
  }

  async function onStateSelect(stateId) {
    setSelectedStateId(stateId);
    try {
      setStateDetails(stateById.get(stateId) || (await api.stateDetails(stateId)));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="app-root">
      <header className="topbar">
        <div>
          <h1>SkillQuest Career Globe</h1>
          <p>Real Earth globe with job clusters, job-country regions, skill-state overlays, and DAG pathways.</p>
        </div>
        <div className={health === 'ok' ? 'status ok' : 'status'}>Backend: {health}</div>
      </header>

      {loading && <div className="banner">Loading backend data and computing skill complexity...</div>}
      {!!error && <div className="banner error">{error}</div>}

      <main className="layout">
        <section className="map-panel">
          <h2>3D Career Globe</h2>
          <p className="muted">
            Job names pop on the globe like country labels. Larger job regions mean deeper skill complexity and more sub-skills.
          </p>
          <GlobeView
            continents={continents}
            roleById={roleById}
            stateById={stateById}
            countryMetrics={countryMetrics}
            roleDetails={roleDetails}
            stateDetails={stateDetails}
            selectedCountry={selectedCountry}
            selectedContinentId={selectedContinentId}
            selectedCountryId={selectedCountry?.id || ''}
            selectedStateId={selectedStateId}
            onCountrySelect={onCountrySelect}
            onStateSelect={onStateSelect}
            onBackToGlobe={onBackToGlobe}
            onBackToCountry={onBackToCountry}
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
