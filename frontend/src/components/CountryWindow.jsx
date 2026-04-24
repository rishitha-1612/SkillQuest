import { useEffect, useMemo, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { api } from '../api/client';
import { getClusterTheme, getRoleWorldProfile } from '../data/worldConfig';
import India3DMap from './India3DMap';
import SkillJourneyPanel from './SkillJourneyPanel';

const PASS_PERCENT = 75;

function buildLevels(nodes, edges) {
  const indeg = new Map(nodes.map((n) => [n.id, 0]));
  const outgoing = new Map(nodes.map((n) => [n.id, []]));

  edges.forEach(([from, to]) => {
    if (outgoing.has(from) && indeg.has(to)) {
      outgoing.get(from).push(to);
      indeg.set(to, indeg.get(to) + 1);
    }
  });

  const queue = [];
  indeg.forEach((value, key) => {
    if (value === 0) queue.push(key);
  });

  const level = new Map(nodes.map((n) => [n.id, 0]));
  for (let i = 0; i < queue.length; i += 1) {
    const current = queue[i];
    outgoing.get(current).forEach((next) => {
      level.set(next, Math.max(level.get(next), level.get(current) + 1));
      indeg.set(next, indeg.get(next) - 1);
      if (indeg.get(next) === 0) queue.push(next);
    });
  }

  return level;
}

function loadCountryProgress(countryId) {
  try {
    const raw = window.localStorage.getItem(`skillquest-progress:${countryId}`);
    if (!raw) return { highestUnlockedIndex: 0, assessments: {} };
    return JSON.parse(raw);
  } catch {
    return { highestUnlockedIndex: 0, assessments: {} };
  }
}

function saveCountryProgress(countryId, progress) {
  window.localStorage.setItem(`skillquest-progress:${countryId}`, JSON.stringify(progress));
}

function ProgressWindow({ countryId, stateDetails, assessmentResult }) {
  if (!stateDetails) {
    return (
      <section className="game-window">
        <div className="window-bar">
          <span className="dot green" />
          <span className="dot yellow" />
          <span className="dot blue" />
          <strong>Level Route</strong>
        </div>
        <div className="window-body">
          <p className="muted">Choose a province on the map.</p>
        </div>
      </section>
    );
  }

  const nodes = stateDetails.nodes || [];
  const edges = stateDetails.edges || [];
  const levels = buildLevels(nodes, edges);
  const grouped = new Map();
  nodes.forEach((node) => {
    const level = levels.get(node.id) || 0;
    if (!grouped.has(level)) grouped.set(level, []);
    grouped.get(level).push(node);
  });

  const cols = [...grouped.keys()].sort((a, b) => a - b);
  const positions = new Map();
  cols.forEach((colId, colIndex) => {
    grouped.get(colId).forEach((node, rowIndex) => {
      positions.set(node.id, {
        x: 100 + colIndex * 170,
        y: 80 + rowIndex * 92,
      });
    });
  });

  return (
    <section className="game-window">
      <div className="window-bar">
        <span className="dot green" />
        <span className="dot yellow" />
        <span className="dot blue" />
        <strong>{stateDetails.title}</strong>
      </div>
      <div className="window-body">
        <div className="path-shell">
          <svg
            width="100%"
            height={Math.max(320, 150 + nodes.length * 40)}
            viewBox={`0 0 820 ${Math.max(320, 150 + nodes.length * 40)}`}
          >
            <defs>
              <marker id="window-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" fill="#56b8ff" />
              </marker>
            </defs>
            {edges.map(([from, to]) => {
              const a = positions.get(from);
              const b = positions.get(to);
              if (!a || !b) return null;
              return (
                <line
                  key={`${from}-${to}`}
                  x1={a.x + 42}
                  y1={a.y}
                  x2={b.x - 42}
                  y2={b.y}
                  className="state-path-edge"
                  markerEnd="url(#window-arrow)"
                />
              );
            })}
            {nodes.map((node, index) => {
              const position = positions.get(node.id);
              return (
                <g key={node.id} className="animated-node" style={{ '--delay': `${index * 80}ms` }}>
                  <circle cx={position.x} cy={position.y} r="30" className="city-node" />
                  <text x={position.x} y={position.y - 2} textAnchor="middle" className="city-label">
                    {index + 1}
                  </text>
                  <text x={position.x} y={position.y + 52} textAnchor="middle" className="city-meta">
                    {node.title}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="level-list">
          {nodes.map((node, index) => (
            <article key={node.id} className="level-card">
              <span className="level-badge">Lv {index + 1}</span>
              <h4>{node.title}</h4>
              <p>{node.description}</p>
              <small>{`${node.type} • ${node.estimated_time_minutes} min • ${node.xp_reward} XP`}</small>
            </article>
          ))}
        </div>
        <div className="assessment-lock-note">
          {assessmentResult?.passed
            ? `Assessment cleared at ${assessmentResult.score}%. Next skill unlocked.`
            : `Finish the route, then pass the 25-question assessment with ${PASS_PERCENT}% or better.`}
        </div>
        <button
          className="assessment-launch-btn"
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.set('window', 'assessment');
            url.searchParams.set('country', countryId);
            url.searchParams.set('state', stateDetails.state_id);
            window.open(url.toString(), '_blank', 'noopener,width=1320,height=920');
          }}
        >
          Take Assessment
        </button>
      </div>
    </section>
  );
}

function GenericCountryMap({ mapData, pathBuilder }) {
  const features = mapData?.features || [];
  if (!features.length || !pathBuilder) return <div className="country-map-fallback">Map loading...</div>;

  return (
    <svg className="country-live-map" viewBox="0 0 920 640">
      {features.map((feature, index) => {
        const [cx, cy] = pathBuilder.centroid(feature);
        return (
          <g key={feature.properties?.shapeID || feature.properties?.shapeName || index}>
            <path d={pathBuilder(feature)} className="country-state-border" />
            {Number.isFinite(cx) && Number.isFinite(cy) && (
              <circle cx={cx} cy={cy} r="2.5" className="country-state-anchor" />
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function CountryWindow({ countryId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [worldMap, setWorldMap] = useState([]);
  const [roleDetails, setRoleDetails] = useState(null);
  const [stateById, setStateById] = useState(new Map());
  const [mapData, setMapData] = useState(null);
  const [selectedStateId, setSelectedStateId] = useState('');
  const [progress, setProgress] = useState(() => loadCountryProgress(countryId));

  useEffect(() => {
    setProgress(loadCountryProgress(countryId));
  }, [countryId]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [wm, role] = await Promise.all([api.worldMap(), api.roleDetails(countryId)]);
        const stateIds = role.state_requirements.map((req) => req.state_id);
        const stateEntries = await Promise.all(
          stateIds.map(async (stateId) => [stateId, await api.stateDetails(stateId)])
        );

        setWorldMap(wm.continents || []);
        setRoleDetails(role);
        setStateById(new Map(stateEntries));

        const profile = getRoleWorldProfile(countryId);
        const stateRes = await fetch(profile.stateMapFile);
        if (!stateRes.ok) throw new Error('Could not load local map file.');
        setMapData(await stateRes.json());

        setSelectedStateId((current) => current || stateIds[0] || '');
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [countryId]);

  useEffect(() => {
    saveCountryProgress(countryId, progress);
  }, [countryId, progress]);

  const selectedCountry = useMemo(
    () => worldMap.flatMap((continent) => continent.countries || []).find((country) => country.id === countryId) || null,
    [worldMap, countryId]
  );

  const profile = getRoleWorldProfile(countryId);
  const theme = getClusterTheme(roleDetails?.continent_id || selectedCountry?.continentId || 'ai_data');
  const stateOrder = roleDetails?.state_requirements?.map((req) => req.state_id) || [];
  const selectedState = stateById.get(selectedStateId) || null;
  const totalLevels = roleDetails?.state_requirements?.reduce(
    (sum, req) => sum + (stateById.get(req.state_id)?.nodes?.length || 0),
    0
  ) || 0;
  const useIndiaCraftedMap = profile.iso3 === 'IND';

  useEffect(() => {
    if (!stateOrder.length) return;
    const fallbackStateId = stateOrder[Math.min(progress.highestUnlockedIndex || 0, stateOrder.length - 1)];
    if (!selectedStateId || !stateOrder.includes(selectedStateId) || stateOrder.indexOf(selectedStateId) > (progress.highestUnlockedIndex || 0)) {
      setSelectedStateId(fallbackStateId);
    }
  }, [progress.highestUnlockedIndex, selectedStateId, stateOrder]);

  const projection = useMemo(() => {
    if (!mapData) return null;
    return geoMercator().fitSize([920, 640], mapData);
  }, [mapData]);

  const pathBuilder = useMemo(() => (projection ? geoPath(projection) : null), [projection]);
  const assessments = progress.assessments || {};
  const selectedAssessment = assessments[selectedStateId] || null;

  function handleStateSelect(stateId) {
    const index = stateOrder.indexOf(stateId);
    if (index > progress.highestUnlockedIndex) return;
    setSelectedStateId(stateId);
  }

  function handleAssessmentComplete(result) {
    const currentIndex = stateOrder.indexOf(selectedStateId);
    setProgress((prev) => {
      const nextAssessments = {
        ...(prev.assessments || {}),
        [selectedStateId]: result,
      };
      const nextHighest = result.passed
        ? Math.min(Math.max(prev.highestUnlockedIndex || 0, currentIndex + 1), Math.max(0, stateOrder.length - 1))
        : prev.highestUnlockedIndex || 0;
      return {
        highestUnlockedIndex: nextHighest,
        assessments: nextAssessments,
      };
    });
  }

  return (
    <div
      className="country-window-root"
      style={{
        '--theme-accent': theme.accent,
        '--theme-glow': theme.glow,
        '--theme-atmosphere': theme.atmosphere,
      }}
    >
      <header className="country-hero">
        <div>
          <p className="eyebrow">Country Window</p>
          <h1>{profile.realm}</h1>
          <p className="hero-text">{`${profile.countryName} • ${roleDetails?.title || countryId}`}</p>
        </div>
        <div className="hero-stats country-hero-stats">
          <article className="stat-card">
            <span>Provinces</span>
            <strong>{roleDetails?.state_requirements?.length || 0}</strong>
          </article>
          <article className="stat-card">
            <span>Levels</span>
            <strong>{totalLevels}</strong>
          </article>
          <article className="stat-card">
            <span>Assessment</span>
            <strong>25 MCQ Gate</strong>
          </article>
          <article className="stat-card">
            <span>Unlock Rule</span>
            <strong>{`${PASS_PERCENT}% to advance`}</strong>
          </article>
        </div>
      </header>

      {loading && <div className="banner">Loading country window...</div>}
      {!!error && <div className="banner error">{error}</div>}

      <main className="country-layout">
        <section className="game-window game-window-large">
          <div className="window-bar">
            <span className="dot green" />
            <span className="dot yellow" />
            <span className="dot blue" />
            <strong>Country Map</strong>
          </div>
          <div className="window-body country-map-window-body">
            <div className="country-map-topline">
              <span>Road-linked skill provinces</span>
              <strong>{selectedState?.title || 'Open a province'}</strong>
            </div>
            {useIndiaCraftedMap ? (
              <India3DMap
                roleDetails={roleDetails}
                stateById={stateById}
                selectedStateId={selectedStateId}
                onStateSelect={handleStateSelect}
              />
            ) : (
              <GenericCountryMap mapData={mapData} pathBuilder={pathBuilder} />
            )}
          </div>
        </section>

        <aside className="country-side">
          <section className="game-window">
            <div className="window-bar">
              <span className="dot green" />
              <span className="dot yellow" />
              <span className="dot blue" />
              <strong>Mission Board</strong>
            </div>
            <div className="window-body">
              <p className="panel-summary">{roleDetails?.summary}</p>
              <div className="skills-list">
                {stateOrder.map((stateId, index) => {
                  const state = stateById.get(stateId);
                  const active = selectedStateId === stateId;
                  const locked = index > (progress.highestUnlockedIndex || 0);
                  const passed = !!assessments[stateId]?.passed;
                  return (
                    <button
                      key={stateId}
                      className={`${active ? 'skill-pill active' : 'skill-pill'}${locked ? ' locked' : ''}${passed ? ' passed' : ''}`}
                      onClick={() => handleStateSelect(stateId)}
                      disabled={locked}
                    >
                      <span>{state?.title || stateId}</span>
                      <small>
                        {passed
                          ? `assessment cleared • ${assessments[stateId].score}%`
                          : locked
                            ? 'locked'
                            : `${state?.nodes?.length || 0} levels`}
                      </small>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <SkillJourneyPanel
            stateOrder={stateOrder}
            stateById={stateById}
            selectedStateId={selectedStateId}
            unlockedIndex={progress.highestUnlockedIndex || 0}
            assessments={assessments}
            onSelect={handleStateSelect}
          />

          <ProgressWindow
            countryId={countryId}
            stateDetails={selectedState}
            assessmentResult={selectedAssessment}
          />
        </aside>
      </main>
    </div>
  );
}
