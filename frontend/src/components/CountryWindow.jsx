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
import CodePuzzle from '../minigames/CodePuzzle';
import DragDropLogic from '../minigames/DragDropLogic';
import DebugChallenge from '../minigames/DebugChallenge';
import ArchitectureArena from '../minigames/ArchitectureArena';
import PromptDuel from '../minigames/PromptDuel';
import DataDetective from '../minigames/DataDetective';
import ThreatHunt from '../minigames/ThreatHunt';
import ModelSculptor from '../minigames/ModelSculptor';
import ChainBuilder from '../minigames/ChainBuilder';
import {
  buildConceptNotes,
  getConceptLearningPlan,
  getConceptProgress,
  getLearningProgress,
  getPracticeResources,
  isLearningRequirementComplete,
} from '../data/learningResources';
import { usePlayerStore } from '../store/playerStore';

const PASS_PERCENT = 75;
const YT_SCRIPT_ID = 'skillquest-youtube-iframe-api';

function loadCountryProgress(countryId) {
  try {
    const raw = window.localStorage.getItem(`skillquest-progress:${countryId}`);
    if (!raw) return { highestUnlockedIndex: 0, assessments: {}, learning: {} };
    return JSON.parse(raw);
  } catch {
    return { highestUnlockedIndex: 0, assessments: {}, learning: {} };
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
  window.open(url.toString(), '_blank', 'noopener');
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

function resolveMiniGame(roleId, stateDetails, city) {
  const stateId = stateDetails?.state_id || '';
  const cityType = (city?.type || '').toLowerCase();

  if (roleId === 'blockchain_developer' || stateId.includes('blockchain')) {
    return ChainBuilder;
  }

  if (roleId === 'prompt_engineer' || stateId.includes('prompt')) {
    return PromptDuel;
  }

  if (
    roleId === 'cloud_architect' ||
    roleId === 'full_stack_engineer' ||
    stateId.includes('system_design') ||
    stateId.includes('cloud_platforms')
  ) {
    return ArchitectureArena;
  }

  if (
    roleId === 'cybersecurity_specialist' ||
    stateId.includes('cybersecurity') ||
    stateId.includes('networking') ||
    stateId.includes('devsecops')
  ) {
    return ThreatHunt;
  }

  if (
    roleId === 'data_scientist' ||
    roleId === 'data_engineer' ||
    stateId.includes('sql') ||
    stateId.includes('data_visualization') ||
    stateId.includes('data_engineering')
  ) {
    return DataDetective;
  }

  if (
    roleId === 'ml_engineer' ||
    (roleId === 'ai_engineer' && (stateId.includes('machine_learning') || stateId.includes('deep_learning'))) ||
    stateId.includes('machine_learning') ||
    stateId.includes('deep_learning')
  ) {
    return ModelSculptor;
  }

  if (
    cityType.includes('challenge') ||
    stateId.includes('python') ||
    stateId.includes('api_integration') ||
    stateId.includes('backend')
  ) {
    return DebugChallenge;
  }

  if (cityType.includes('interactive') || cityType.includes('game')) {
    return DragDropLogic;
  }

  return CodePuzzle;
}

function CityMinigameModal({ roleId, stateDetails, city, open, onClose, onFinish }) {
  if (!open || !city) return null;
  const MiniGame = resolveMiniGame(roleId, stateDetails, city);

  return (
    <div className="minigame-modal-backdrop" onClick={onClose}>
      <div className="minigame-modal" onClick={(event) => event.stopPropagation()}>
        <div className="window-bar">
          <span className="dot green" />
          <span className="dot yellow" />
          <span className="dot blue" />
          <strong>{`${city.title} Quest`}</strong>
        </div>
        <div className="window-body">
          <MiniGame city={city} onFinish={onFinish} />
        </div>
      </div>
    </div>
  );
}

function ensureYouTubeApi() {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  return new Promise((resolve) => {
    const existing = document.getElementById(YT_SCRIPT_ID);
    if (!existing) {
      const script = document.createElement('script');
      script.id = YT_SCRIPT_ID;
      script.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(script);
    }

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve(window.YT);
    };
  });
}

function LessonVideoModal({ concept, open, onClose, onVideoComplete }) {
  const [externalOpened, setExternalOpened] = useState(false);
  const playerMountId = useMemo(
    () => `lesson-player-${concept?.videoId || 'empty'}-${Math.random().toString(36).slice(2)}`,
    [concept]
  );

  useEffect(() => {
    if (!open || !concept?.videoId) return undefined;
    let player;
    let cancelled = false;

    ensureYouTubeApi().then((YT) => {
      if (cancelled) return;
      player = new YT.Player(playerMountId, {
        videoId: concept.videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          start: concept.startSeconds || 0,
          end: concept.endSeconds || undefined,
        },
        events: {
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.ENDED) {
              onVideoComplete(concept.nodeId);
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (player?.destroy) player.destroy();
    };
  }, [concept, open, onVideoComplete, playerMountId]);

  useEffect(() => {
    if (!open) setExternalOpened(false);
  }, [open, concept]);

  if (!open || !concept) return null;

  return (
    <div className="minigame-modal-backdrop" onClick={onClose}>
      <div className="lesson-modal" onClick={(event) => event.stopPropagation()}>
        <div className="window-bar">
          <span className="dot green" />
          <span className="dot yellow" />
          <span className="dot blue" />
          <strong>{`${concept.title} Lesson`}</strong>
        </div>
        <div className="window-body lesson-modal-body">
          <div className="lesson-modal-copy">
            <p className="panel-summary">
              Finish this concept lesson before moving ahead. Open the recommended video, learn the idea clearly, and then mark it complete.
            </p>
            <div className="lesson-resource-meta">
              <span>{concept.channel}</span>
              <span>{concept.duration}</span>
            </div>
          </div>
          <div className="lesson-video-frame">
            {concept.videoId ? (
              <div id={playerMountId} />
            ) : (
              <div className="lesson-resource-card">
                <div>
                  <strong>{concept.videoTitle}</strong>
                  <p>{concept.searchQuery}</p>
                </div>
              </div>
            )}
          </div>
          <div className="lesson-modal-actions">
            <a
              className="assessment-ghost-btn lesson-link-btn"
              href={concept.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => setExternalOpened(true)}
            >
              Open recommended video
            </a>
            {!concept.videoId && (
              <button
                type="button"
                className="assessment-submit-btn"
                disabled={!externalOpened}
                onClick={() => onVideoComplete(concept.nodeId)}
              >
                Mark lesson complete
              </button>
            )}
            <button type="button" className="assessment-submit-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressWindow({
  countryId,
  stateDetails,
  progress,
  assessmentResult,
  completedCities,
  unlockedCities,
  onLaunchCity,
  onContinueJourney,
  onOpenLesson,
  onMarkConceptNotesRead,
  assessmentLocked,
}) {
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
  const conceptPlan = getConceptLearningPlan(stateDetails);
  const practiceResources = getPracticeResources(stateDetails);
  const completedSet = new Set(completedCities || []);
  const unlockedSet = new Set(unlockedCities || [nodes[0]?.id].filter(Boolean));
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
            <small>watch the short concept clip</small>
          </article>
          <article className="quest-loop-step">
            <span>2</span>
            <strong>Read</strong>
            <small>finish the concept notes</small>
          </article>
          <article className="quest-loop-step">
            <span>3</span>
            <strong>Play</strong>
            <small>solve the city challenge</small>
          </article>
          <article className="quest-loop-step">
            <span>4</span>
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
            const concept = conceptPlan.find((item) => item.nodeId === node.id);
            const conceptProgress = getConceptProgress(progress, stateDetails.state_id, node.id);
            const previousNode = nodes[index - 1];
            const previousReady =
              !previousNode ||
              getConceptProgress(progress, stateDetails.state_id, previousNode.id).videoDone;
            const videoDone = Boolean(conceptProgress.videoDone);
            const notesDone = Boolean(conceptProgress.notesDone);
            const conceptReady = videoDone && notesDone;
            const isBoss = index === nodes.length - 1;
            const completed = completedSet.has(node.id);
            const unlocked = previousReady && (unlockedSet.has(node.id) || index === 0);
            const noteSections = buildConceptNotes(stateDetails, node, index);

            return (
              <article key={node.id} className={`level-card quest-card${isBoss ? ' is-boss' : ''}${completed ? ' is-completed' : ''}${!unlocked ? ' is-locked' : ''}`}>
                <div className="quest-card-topline">
                  <span className="level-badge">Lv {index + 1}</span>
                  <span className={`quest-mode-pill ${questMode.className}`}>{questMode.label}</span>
                </div>
                <h4>{node.title}</h4>
                <p>{node.description}</p>
                <div className="quest-card-meta">
                  <strong>{questMode.detail}</strong>
                  <small>{`${node.estimated_time_minutes} min - ${node.xp_reward} XP`}</small>
                </div>
                <article className={`lesson-resource-card${videoDone ? ' is-complete' : ''}`}>
                  <div>
                    <strong>{concept?.videoTitle || `${node.title} concept clip`}</strong>
                    <p>{concept ? `${concept.channel} - ${concept.duration}` : 'Concept clip'}</p>
                  </div>
                  <div className="lesson-resource-actions">
                    <button
                      type="button"
                      className="assessment-ghost-btn"
                      disabled={!unlocked}
                      onClick={() => concept && onOpenLesson(concept)}
                    >
                      {videoDone ? 'Rewatch clip' : 'Watch clip'}
                    </button>
                    <span className="quest-status-chip">
                      {videoDone ? 'watched' : unlocked ? 'watch now' : 'locked'}
                    </span>
                  </div>
                </article>
                <article className={`lesson-notes-card${notesDone ? ' is-complete' : ''}`}>
                  <div className="lesson-notes-header">
                    <strong>Concept notes</strong>
                    <button
                      type="button"
                      className="assessment-ghost-btn"
                      disabled={!videoDone}
                      onClick={() => onMarkConceptNotesRead(node.id)}
                    >
                      {notesDone ? 'Notes completed' : 'Mark notes as read'}
                    </button>
                  </div>
                  <div className="lesson-notes-sections">
                    {noteSections.map((section) => (
                      <div key={section.title} className="lesson-notes-section">
                        <h5>{section.title}</h5>
                        <ul>
                          {section.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </article>
                {!!practiceResources.length && (
                  <article className="lesson-resource-card">
                    <div>
                      <strong>Fast practice</strong>
                      <p>Use these quick tools to lock the concept in faster.</p>
                    </div>
                    <div className="lesson-resource-actions">
                      {practiceResources.slice(0, 2).map((resource) => (
                        <a
                          key={resource.url}
                          className="assessment-ghost-btn lesson-link-btn"
                          href={resource.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {resource.title}
                        </a>
                      ))}
                    </div>
                  </article>
                )}
                <div className="quest-card-actions">
                  <button
                    className="assessment-ghost-btn"
                    disabled={!unlocked || !conceptReady}
                    onClick={() => onLaunchCity(node)}
                  >
                    {completed ? 'Replay City' : 'Play City'}
                  </button>
                  <span className="quest-status-chip">
                    {completed ? 'cleared' : !unlocked ? 'locked' : !videoDone ? 'learn first' : !notesDone ? 'read notes' : 'ready'}
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        <div className="assessment-lock-note">
          <strong>
            {assessmentResult?.passed
              ? 'Assessment cleared.'
              : assessmentLocked
                ? 'Finish every concept clip, every note, and every city to unlock the assessment.'
                : `Pass ${PASS_PERCENT}% or higher to unlock the next skill.`}
          </strong>
          <div>
            {assessmentResult
              ? `Latest score: ${assessmentResult.score}% (${assessmentResult.correctCount}/${assessmentResult.totalQuestions})`
              : assessmentLocked
                ? 'The boss battle unlocks only after the concept track and city route are complete.'
                : 'The assessment opens in a separate window so the learning screen stays clean.'}
          </div>
        </div>

        <button
          className="assessment-launch-btn"
          disabled={assessmentLocked}
          onClick={onContinueJourney || (() => launchAssessmentWindow(countryId, stateDetails.state_id))}
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
  const [activeCity, setActiveCity] = useState(null);
  const gainXP = usePlayerStore((state) => state.gainXP);
  const unlockSkill = usePlayerStore((state) => state.unlockSkill);
  const setCurrentRole = usePlayerStore((state) => state.setCurrentRole);
  const markCityCompleted = usePlayerStore((state) => state.markCityCompleted);
  const unlockCity = usePlayerStore((state) => state.unlockCity);
  const addMistake = usePlayerStore((state) => state.addMistake);
  const playerLevel = usePlayerStore((state) => state.level);
  const playerXp = usePlayerStore((state) => state.xp);

  useEffect(() => {
    setProgress(loadCountryProgress(countryId));
  }, [countryId]);

  useEffect(() => {
    saveCountryProgress(countryId, progress);
  }, [countryId, progress]);

  useEffect(() => {
    setCurrentRole(countryId);
  }, [countryId, setCurrentRole]);

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
  const completedCities = progress.completedCities?.[selectedStateId] || [];
  const unlockedCities = progress.unlockedCities?.[selectedStateId] || [selectedState?.nodes?.[0]?.id].filter(Boolean);
  const assessmentLocked = Boolean(
    selectedState &&
      (
        selectedState.nodes?.some((node) => !completedCities.includes(node.id)) ||
        !isLearningRequirementComplete(selectedState, progress)
      )
  );
  const useChinaCraftedMap = profile.iso3 === 'CHN';
  const useIndiaCraftedMap = profile.iso3 === 'IND';
  const useKoreaCraftedMap = profile.iso3 === 'KOR';
  const useSaudiCraftedMap = profile.iso3 === 'SAU';
  const [activeConcept, setActiveConcept] = useState(null);

  function handleSelectState(stateId) {
    const index = stateOrder.indexOf(stateId);
    if (index <= highestUnlockedIndex) {
      setSelectedStateId(stateId);
    }
  }

  async function handleCityResult(city, result) {
    setActiveCity(null);
    if (!selectedState) return;
    if (!result.success && result.mistake) {
      addMistake(result.mistake);
    }

    const currentCompleted = progress.completedCities?.[selectedState.state_id] || [];
    const apiResult = await api.progression(selectedState.state_id, {
      completed_nodes: currentCompleted,
      completed_city: city.id,
      score: result.success ? 100 : 45,
      player_level: playerLevel,
      player_xp: playerXp,
    });

    gainXP(apiResult.xp_gained, city.title);
    markCityCompleted(selectedState.state_id, city.id, 0);
    unlockSkill(selectedState.state_id);
    apiResult.unlocked_nodes.forEach((nodeId) => unlockCity(selectedState.state_id, nodeId));

    setProgress((prev) => ({
      ...prev,
      completedCities: {
        ...(prev.completedCities || {}),
        [selectedState.state_id]: Array.from(new Set([...(prev.completedCities?.[selectedState.state_id] || []), city.id])),
      },
      unlockedCities: {
        ...(prev.unlockedCities || {}),
        [selectedState.state_id]: Array.from(new Set([...(prev.unlockedCities?.[selectedState.state_id] || []), ...apiResult.unlocked_nodes])),
      },
    }));
  }

  function launchNextAction() {
    const nodes = selectedState?.nodes || [];
    const nextConceptNode = nodes.find((node) => !getConceptProgress(progress, selectedStateId, node.id).videoDone);
    if (nextConceptNode) {
      const concept = getConceptLearningPlan(selectedState).find((item) => item.nodeId === nextConceptNode.id);
      if (concept) setActiveConcept(concept);
      return;
    }
    const nextNotesNode = nodes.find((node) => !getConceptProgress(progress, selectedStateId, node.id).notesDone);
    if (nextNotesNode) {
      return;
    }
    const nextCity = nodes.find((node) => !(progress.completedCities?.[selectedStateId] || []).includes(node.id));
    if (nextCity) {
      setActiveCity(nextCity);
      return;
    }
    if (selectedState && !assessmentLocked) {
      launchAssessmentWindow(countryId, selectedState.state_id);
    }
  }

  function handleLessonComplete(nodeId) {
    setProgress((prev) => ({
      ...prev,
      learning: {
        ...(prev.learning || {}),
        [selectedStateId]: {
          ...getLearningProgress(prev, selectedStateId),
          concepts: {
            ...(getLearningProgress(prev, selectedStateId).concepts || {}),
            [nodeId]: {
              ...getConceptProgress(prev, selectedStateId, nodeId),
              videoDone: true,
            },
          },
        },
      },
    }));
  }

  function handleNotesRead(nodeId) {
    setProgress((prev) => ({
      ...prev,
      learning: {
        ...(prev.learning || {}),
        [selectedStateId]: {
          ...getLearningProgress(prev, selectedStateId),
          concepts: {
            ...(getLearningProgress(prev, selectedStateId).concepts || {}),
            [nodeId]: {
              ...getConceptProgress(prev, selectedStateId, nodeId),
              notesDone: true,
            },
          },
        },
      },
    }));
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
            progress={progress}
            assessmentResult={selectedAssessment}
            completedCities={completedCities}
            unlockedCities={unlockedCities}
            onLaunchCity={setActiveCity}
            onContinueJourney={launchNextAction}
            onOpenLesson={setActiveConcept}
            onMarkConceptNotesRead={handleNotesRead}
            assessmentLocked={assessmentLocked}
          />

          <TutorChatPanel roleDetails={roleDetails} stateDetails={selectedState} />
        </aside>
      </main>

      <CityMinigameModal
        roleId={countryId}
        stateDetails={selectedState}
        city={activeCity}
        open={!!activeCity}
        onClose={() => setActiveCity(null)}
        onFinish={(result) => handleCityResult(activeCity, result)}
      />

      <LessonVideoModal
        concept={activeConcept}
        open={!!activeConcept}
        onClose={() => setActiveConcept(null)}
        onVideoComplete={handleLessonComplete}
      />
    </div>
  );
}
