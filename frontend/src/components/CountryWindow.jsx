import { useEffect, useMemo, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { api } from '../api/client';
import { getClusterTheme, getRoleWorldProfile } from '../data/worldConfig';
import India3DMap from './India3DMap';
import Korea3DMap from './Korea3DMap';

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
  const useIndiaCraftedMap = profile.iso3 === 'IND';
  const useKoreaCraftedMap = profile.iso3 === 'KOR';

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
              <India3DMap
                roleDetails={roleDetails}
                stateById={stateById}
                selectedStateId={selectedStateId}
                onStateSelect={setSelectedStateId}
              />
            ) : useKoreaCraftedMap ? (
              <Korea3DMap
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
