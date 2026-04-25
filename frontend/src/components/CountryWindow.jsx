import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { getClusterTheme, getRoleWorldProfile } from '../data/worldConfig';
import CountryMap3D from './CountryMap3D';
import China3DMap from './China3DMap';
import India3DMap from './India3DMap';
import Korea3DMap from './Korea3DMap';
import SaudiArabia3DMap from './SaudiArabia3DMap';
import SkillJourneyPanel from './SkillJourneyPanel';
import TutorChatPanel from './TutorChatPanel';

const PASS_PERCENT = 75;

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
    const cur = queue[i];
    outgoing.get(cur).forEach((next) => {
      level.set(next, Math.max(level.get(next), level.get(cur) + 1));
      indeg.set(next, indeg.get(next) - 1);
      if (indeg.get(next) === 0) queue.push(next);
    });
  }

  return level;
}

function launchAssessmentWindow(countryId, stateId) {
  const url = new URL(window.location.href);
  url.searchParams.set('window', 'assessment');
  url.searchParams.set('country', countryId);
  url.searchParams.set('state', stateId);
  window.open(url.toString(), '_blank', 'noopener,width=1320,height=920');
}

function getQuestMode(type) {
  const value = (type || '').toLowerCase();
  if (value.includes('challenge')) {
    return {
      label: 'Boss Quest',
      detail: 'High-pressure final mission',
      className: 'boss',
    };
  }
  if (value.includes('quiz')) {
    return {
      label: 'Ranked Drill',
      detail: 'Timed confidence check',
      className: 'ranked',
    };
  }
  if (value.includes('interactive') || value.includes('game')) {
    return {
      label: 'Skill Arena',
      detail: 'Hands-on game mission',
      className: 'arena',
    };
  }
  return {
    label: 'Learn Run',
    detail: 'Core concept lesson',
    className: 'learn',
  };
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
          <p className="muted">Choose a skill province to see its route.</p>
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
        <div className="quest-loop-banner">
          <article className="quest-loop-step">
            <span>1</span>
            <strong>Learn</strong>
            <small>understand the core idea</small>
          </article>
          <article className="quest-loop-step">
            <span>2</span>
            <strong>Play</strong>
            <small>solve the city challenge</small>
          </article>
          <article className="quest-loop-step">
            <span>3</span>
            <strong>Clear</strong>
            <small>beat the state assessment</small>
          </article>
        </div>

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
              const point = positions.get(node.id);
              return (
                <g key={node.id} className="animated-node" style={{ '--delay': `${index * 80}ms` }}>
                  <circle cx={point.x} cy={point.y} r="30" className="city-node" />
                  <text x={point.x} y={point.y - 2} textAnchor="middle" className="city-label">
                    {index + 1}
                  </text>
                  <text x={point.x} y={point.y + 52} textAnchor="middle" className="city-meta">
                    {node.title}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="level-list">
          {nodes.map((node, index) => {
            const questMode = getQuestMode(node.type);
            const isBoss = index === nodes.length - 1;
            return (
              <article key={node.id} className={`level-card quest-card${isBoss ? ' is-boss' : ''}`}>
                <div className="quest-card-topline">
                  <span className="level-badge">Lv {index + 1}</span>
                  <span className={`quest-mode-pill ${questMode.className}`}>{questMode.label}</span>
                </div>
                <h4>{node.title}</h4>
                <p>{node.description}</p>
                <div className="quest-card-meta">
                  <strong>{questMode.detail}</strong>
                  <small>{`${node.estimated_time_minutes} min • ${node.xp_reward} XP`}</small>
                </div>
              </article>
            );
          })}
        </div>

        <div className="assessment-lock-note">
          <strong>{assessmentResult?.passed ? 'Assessment cleared.' : `Pass ${PASS_PERCENT}% or higher to unlock the next skill.`}</strong>
          <div>
            {assessmentResult
              ? `Latest score: ${assessmentResult.score}% (${assessmentResult.correctCount}/${assessmentResult.totalQuestions})`
              : 'The assessment opens in a separate window so the learning screen stays clean.'}
          </div>
        </div>

        <button
          className="assessment-launch-btn"
          onClick={() => launchAssessmentWindow(countryId, stateDetails.state_id)}
        >
          Take Assessment
        </button>
      </div>
    </section>
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
    saveCountryProgress(countryId, progress);
  }, [countryId, progress]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [wm, role] = await Promise.all([
          api.worldMap(),
          api.roleDetails(countryId),
        ]);

        const stateIds = (role.state_requirements || []).map((req) => req.state_id);
        const entries = await Promise.all(
          stateIds.map(async (stateId) => [stateId, await api.stateDetails(stateId)])
        );

        const nextStateById = new Map(entries);
        const profile = getRoleWorldProfile(countryId);
        const stateRes = await fetch(profile.stateMapFile);
        if (!stateRes.ok) throw new Error('Could not load local map file.');
        const nextMapData = await stateRes.json();

        const storedProgress = loadCountryProgress(countryId);
        const safeIndex = Math.min(storedProgress.highestUnlockedIndex || 0, Math.max(0, stateIds.length - 1));

        setWorldMap(wm.continents || []);
        setRoleDetails(role);
        setStateById(nextStateById);
        setMapData(nextMapData);
        setProgress(storedProgress);
        setSelectedStateId((current) => {
          if (current && nextStateById.has(current)) return current;
          return stateIds[safeIndex] || stateIds[0] || '';
        });
      } catch (e) {
        setError(e.message || 'Failed to load country window.');
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
  const stateOrder = roleDetails?.state_requirements?.map((req) => req.state_id) || [];
  const highestUnlockedIndex = Math.min(progress.highestUnlockedIndex || 0, Math.max(0, stateOrder.length - 1));

  useEffect(() => {
    if (!stateOrder.length) return;
    const selectedIndex = stateOrder.indexOf(selectedStateId);
    if (selectedIndex === -1 || selectedIndex > highestUnlockedIndex) {
      setSelectedStateId(stateOrder[highestUnlockedIndex] || stateOrder[0] || '');
    }
  }, [highestUnlockedIndex, selectedStateId, stateOrder]);

  const selectedState = stateById.get(selectedStateId) || null;
  const selectedAssessment = selectedStateId ? progress.assessments?.[selectedStateId] || null : null;
  const totalLevels = stateOrder.reduce((sum, stateId) => sum + (stateById.get(stateId)?.nodes?.length || 0), 0);
  const passedCount = stateOrder.filter((stateId) => progress.assessments?.[stateId]?.passed).length;
  const activeStateIndex = Math.max(0, stateOrder.indexOf(selectedStateId));
  const useChinaCraftedMap = profile.iso3 === 'CHN';
  const useIndiaCraftedMap = profile.iso3 === 'IND';
  const useKoreaCraftedMap = profile.iso3 === 'KOR';
  const useSaudiCraftedMap = profile.iso3 === 'SAU';

  function handleSelectState(stateId) {
    const index = stateOrder.indexOf(stateId);
    if (index <= highestUnlockedIndex) {
      setSelectedStateId(stateId);
    }
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
            <strong>{stateOrder.length}</strong>
          </article>
          <article className="stat-card">
            <span>Levels</span>
            <strong>{totalLevels}</strong>
          </article>
          <article className="stat-card">
            <span>Cleared</span>
            <strong>{`${passedCount}/${stateOrder.length}`}</strong>
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
          <div className="window-body country-map-window-body">
            <div className="country-map-topline">
              <span>Active Skill</span>
              <strong>{selectedState?.title || 'Choose a province'}</strong>
            </div>

            {useChinaCraftedMap ? (
              <China3DMap
                roleDetails={roleDetails}
                stateById={stateById}
                selectedStateId={selectedStateId}
                onStateSelect={handleSelectState}
              />
            ) : useIndiaCraftedMap ? (
              <India3DMap
                roleDetails={roleDetails}
                stateById={stateById}
                selectedStateId={selectedStateId}
                onStateSelect={handleSelectState}
              />
            ) : useKoreaCraftedMap ? (
              <Korea3DMap
                roleDetails={roleDetails}
                stateById={stateById}
                selectedStateId={selectedStateId}
                onStateSelect={handleSelectState}
              />
            ) : useSaudiCraftedMap ? (
              <SaudiArabia3DMap
                roleDetails={roleDetails}
                stateById={stateById}
                selectedStateId={selectedStateId}
                onStateSelect={handleSelectState}
              />
            ) : (
              <CountryMap3D mapData={mapData} selectedStateId={selectedStateId} />
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
              <div className="mission-rank-strip">
                <article className="mission-rank-card">
                  <span>Current State</span>
                  <strong>{`${activeStateIndex + 1}/${stateOrder.length}`}</strong>
                </article>
                <article className="mission-rank-card">
                  <span>Roadmap Loop</span>
                  <strong>Learn • Play • Clear</strong>
                </article>
                <article className="mission-rank-card">
                  <span>Boss Gates</span>
                  <strong>{`${stateOrder.length - passedCount} left`}</strong>
                </article>
              </div>
              <div className="skills-list">
                {stateOrder.map((stateId, index) => {
                  const state = stateById.get(stateId);
                  const active = selectedStateId === stateId;
                  const locked = index > highestUnlockedIndex;
                  const passed = !!progress.assessments?.[stateId]?.passed;
                  const cityCount = state?.nodes?.length || 0;
                  return (
                    <button
                      key={stateId}
                      className={`skill-pill${active ? ' active' : ''}${locked ? ' locked' : ''}${passed ? ' passed' : ''}`}
                      onClick={() => handleSelectState(stateId)}
                      disabled={locked}
                    >
                      <span>{state?.title || stateId}</span>
                      <small>
                        {locked
                          ? 'locked'
                          : passed
                            ? `passed ${progress.assessments?.[stateId]?.score || PASS_PERCENT}%`
                            : `${cityCount} cities`}
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
            unlockedIndex={highestUnlockedIndex}
            assessments={progress.assessments || {}}
            onSelect={handleSelectState}
          />

          <ProgressWindow
            countryId={countryId}
            stateDetails={selectedState}
            assessmentResult={selectedAssessment}
          />

          <TutorChatPanel roleDetails={roleDetails} stateDetails={selectedState} />
        </aside>
      </main>
    </div>
  );
}
