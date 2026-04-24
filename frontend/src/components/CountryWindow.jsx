import { useEffect, useMemo, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { api } from '../api/client';
import { getClusterTheme, getRoleWorldProfile } from '../data/worldConfig';

const INDIA_SKILL_LAYOUT = {
  python_programming: {
    stateName: 'Karnataka',
    path: 'M314,498 L364,484 L382,524 L364,566 L320,572 L294,532 Z',
    x: 338,
    y: 526,
  },
  mathematics_statistics: {
    stateName: 'Rajasthan',
    path: 'M192,196 L272,172 L324,206 L312,286 L232,302 L180,248 Z',
    x: 248,
    y: 236,
  },
  machine_learning: {
    stateName: 'Maharashtra',
    path: 'M224,360 L326,344 L360,404 L334,466 L242,472 L194,424 Z',
    x: 278,
    y: 404,
  },
  deep_learning: {
    stateName: 'Telangana',
    path: 'M404,392 L454,382 L478,424 L456,466 L410,472 L386,434 Z',
    x: 432,
    y: 426,
  },
  data_visualization: {
    stateName: 'West Bengal',
    path: 'M560,254 L620,236 L652,286 L632,346 L586,360 L548,316 Z',
    x: 600,
    y: 296,
  },
};

const INDIA_BASE_REGIONS = [
  'M248,82 L338,92 L406,126 L470,136 L552,188 L618,236 L664,318 L642,406 L590,478 L562,574 L514,646 L454,722 L398,768 L350,744 L314,682 L280,650 L222,616 L194,556 L170,500 L146,404 L158,326 L138,246 L166,194 L214,166 L236,118 Z',
  'M602,146 L652,142 L688,174 L704,216 L684,244 L636,234 L602,198 Z',
  'M366,748 L394,792 L438,816 L474,806 L462,848 L416,876 L366,860 L340,816 Z',
];

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
  indeg.forEach((v, k) => {
    if (v === 0) queue.push(k);
  });

  const level = new Map(nodes.map((n) => [n.id, 0]));
  for (let i = 0; i < queue.length; i += 1) {
    const cur = queue[i];
    outgoing.get(cur).forEach((nxt) => {
      level.set(nxt, Math.max(level.get(nxt), level.get(cur) + 1));
      indeg.set(nxt, indeg.get(nxt) - 1);
      if (indeg.get(nxt) === 0) queue.push(nxt);
    });
  }

  return level;
}

function ProgressWindow({ stateDetails }) {
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
    const l = levels.get(node.id) || 0;
    if (!grouped.has(l)) grouped.set(l, []);
    grouped.get(l).push(node);
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
          <svg width="100%" height={Math.max(320, 150 + nodes.length * 40)} viewBox={`0 0 820 ${Math.max(320, 150 + nodes.length * 40)}`}>
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
              const p = positions.get(node.id);
              return (
                <g key={node.id} className="animated-node" style={{ '--delay': `${index * 80}ms` }}>
                  <circle cx={p.x} cy={p.y} r="30" className="city-node" />
                  <text x={p.x} y={p.y - 2} textAnchor="middle" className="city-label">
                    {index + 1}
                  </text>
                  <text x={p.x} y={p.y + 52} textAnchor="middle" className="city-meta">
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
              <small>{node.type} • {node.estimated_time_minutes} min • {node.xp_reward} XP</small>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function IndiaStylizedMap({ roleDetails, stateById, selectedStateId, onStateSelect }) {
  const requirements = roleDetails?.state_requirements || [];

  return (
    <div className="india-crafted-map-shell">
      <svg className="india-crafted-map" viewBox="0 0 820 920" aria-label="India skill map">
        <defs>
          <linearGradient id="indiaSea" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#9be4ff" />
            <stop offset="100%" stopColor="#dff7ff" />
          </linearGradient>
          <linearGradient id="indiaLand" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fff1" />
            <stop offset="100%" stopColor="#e4f7d7" />
          </linearGradient>
        </defs>
        <rect width="820" height="920" rx="28" fill="url(#indiaSea)" />
        <circle cx="110" cy="110" r="42" fill="rgba(255,255,255,0.48)" />
        <circle cx="724" cy="150" r="34" fill="rgba(255,255,255,0.28)" />
        {INDIA_BASE_REGIONS.map((path, index) => (
          <path key={`base-${index}`} d={path} className="india-landmass" fill="url(#indiaLand)" />
        ))}
        {requirements.map((req, index) => {
          const layout = INDIA_SKILL_LAYOUT[req.state_id];
          const state = stateById.get(req.state_id);
          if (!layout || !state) return null;
          const active = selectedStateId === req.state_id;

          return (
            <g
              key={req.state_id}
              className={active ? 'india-region-group active' : 'india-region-group'}
              style={{ '--delay': `${index * 120}ms` }}
              onClick={() => onStateSelect(req.state_id)}
            >
              <path d={layout.path} className="india-skill-region" />
              <circle cx={layout.x} cy={layout.y} r="12" className="india-skill-dot" />
              <g transform={`translate(${layout.x}, ${layout.y + 24})`} className="india-skill-label-group">
                <rect x="-88" y="-10" width="176" height="56" rx="18" className="india-skill-card-box" />
                <text x="0" y="10" textAnchor="middle" className="india-skill-card-title">
                  {state.title}
                </text>
                <text x="0" y="30" textAnchor="middle" className="india-skill-card-subtitle">
                  {layout.stateName}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function CountryWindow({ countryId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [worldMap, setWorldMap] = useState([]);
  const [roleDetails, setRoleDetails] = useState(null);
  const [states, setStates] = useState([]);
  const [stateById, setStateById] = useState(new Map());
  const [mapData, setMapData] = useState(null);
  const [selectedStateId, setSelectedStateId] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [wm, st, role] = await Promise.all([
          api.worldMap(),
          api.states(),
          api.roleDetails(countryId),
        ]);

        const stateIds = role.state_requirements.map((req) => req.state_id);
        const entries = await Promise.all(stateIds.map(async (stateId) => [stateId, await api.stateDetails(stateId)]));
        const map = new Map(entries);
        setWorldMap(wm.continents || []);
        setStates(st.states || []);
        setRoleDetails(role);
        setStateById(map);

        const profile = getRoleWorldProfile(countryId);
        const stateRes = await fetch(profile.stateMapFile);
        if (!stateRes.ok) throw new Error('Could not load local map file.');
        setMapData(await stateRes.json());
        setSelectedStateId(stateIds[0] || '');
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [countryId]);

  const selectedCountry = useMemo(
    () => worldMap.flatMap((continent) => continent.countries || []).find((country) => country.id === countryId) || null,
    [worldMap, countryId]
  );
  const profile = getRoleWorldProfile(countryId);
  const theme = getClusterTheme(roleDetails?.continent_id || selectedCountry?.continentId || 'ai_data');
  const selectedState = stateById.get(selectedStateId) || null;
  const useIndiaCraftedMap = countryId === 'data_scientist';

  const projection = useMemo(() => {
    if (!mapData) return null;
    return geoMercator().fitSize([920, 640], mapData);
  }, [mapData]);

  const pathBuilder = useMemo(() => (projection ? geoPath(projection) : null), [projection]);
  const totalLevels = roleDetails?.state_requirements?.reduce((sum, req) => sum + (stateById.get(req.state_id)?.nodes?.length || 0), 0) || 0;

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
          <p className="hero-text">{profile.countryName} • {roleDetails?.title || countryId}</p>
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
            <span>Window</span>
            <strong>Live Map</strong>
          </article>
          <article className="stat-card">
            <span>Mode</span>
            <strong>Play</strong>
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
          <div className="window-body">
            {useIndiaCraftedMap ? (
              <IndiaStylizedMap
                roleDetails={roleDetails}
                stateById={stateById}
                selectedStateId={selectedStateId}
                onStateSelect={setSelectedStateId}
              />
            ) : pathBuilder && mapData?.features?.length ? (
              <svg className="country-live-map" viewBox="0 0 920 640">
                {mapData.features.map((feature, index) => (
                  <path
                    key={feature.properties?.shapeID || feature.properties?.shapeName || index}
                    d={pathBuilder(feature)}
                    className="country-state-border"
                  />
                ))}
              </svg>
            ) : (
              <div className="country-map-fallback">Map loading...</div>
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
                {(roleDetails?.state_requirements || []).map((req) => {
                  const state = stateById.get(req.state_id);
                  const active = selectedStateId === req.state_id;
                  return (
                    <button
                      key={req.state_id}
                      className={active ? 'skill-pill active' : 'skill-pill'}
                      onClick={() => setSelectedStateId(req.state_id)}
                    >
                      <span>{state?.title || req.state_id}</span>
                      <small>{state?.nodes?.length || 0} levels</small>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <ProgressWindow stateDetails={selectedState} />
        </aside>
      </main>
    </div>
  );
}
