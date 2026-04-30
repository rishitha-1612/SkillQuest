import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { INDIA_STATES } from '../data/indiaStates';

const PALETTE = [
  ['#dff8c7', '#63b840'],
  ['#d8f6ed', '#4cae8a'],
  ['#dff1ff', '#5ca6e8'],
  ['#f8f0d2', '#c7af45'],
  ['#ece5ff', '#8477df'],
];

const NORTHEAST = new Set([
  'Arunachal Pradesh',
  'Assam',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Tripura',
  'Sikkim',
]);

const NORTH = new Set([
  'Jammu and Kashmir',
  'Himachal Pradesh',
  'Punjab',
  'Haryana',
  'Delhi',
  'Chandigarh',
  'Uttaranchal',
  'Uttar Pradesh',
]);

const GROUP_COLORS = {
  northeast: ['#d8f6ed', '#4cae8a'],
  north: ['#dff8c7', '#63b840'],
};

const INDIA_SKILL_STATES = {
  python_programming: 'Karnataka',
  mathematics_statistics: 'Rajasthan',
  machine_learning: 'Maharashtra',
  deep_learning: 'Telangana',
  data_engineering: 'Tamil Nadu',
  prompt_engineering: 'Kerala',
  api_integration: 'Andhra Pradesh',
  system_design: 'Madhya Pradesh',
  cloud_platforms: 'Gujarat',
  data_visualization: 'West Bengal',
};

const DEPTH_LAYERS = 10;
const DEPTH_STEP = 1.4;
const HOVER_LIFT = 14;
const DRAW_DURATION_MS = 1150;
const MOVE_DURATION_MS = 1750;
const BIKER_SCALE = 0.66;

const ROUTE_PATH_BUILDERS = {
  'Karnataka->Rajasthan': (from, to) =>
    `M ${from.cx} ${from.cy} C ${from.cx - 68} ${from.cy - 72}, ${to.cx - 42} ${to.cy + 154}, ${to.cx} ${to.cy}`,
  'Rajasthan->Maharashtra': (from, to) =>
    `M ${from.cx} ${from.cy} C ${from.cx - 24} ${from.cy + 92}, ${to.cx - 36} ${to.cy - 34}, ${to.cx} ${to.cy}`,
  'Maharashtra->Telangana': (from, to) =>
    `M ${from.cx} ${from.cy} C ${from.cx + 44} ${from.cy - 6}, ${to.cx - 36} ${to.cy - 24}, ${to.cx} ${to.cy}`,
  'Telangana->West Bengal': (from, to) =>
    `M ${from.cx} ${from.cy} C ${from.cx + 124} ${from.cy - 68}, ${to.cx - 110} ${to.cy + 114}, ${to.cx} ${to.cy}`,
};

function groupOf(name) {
  if (NORTHEAST.has(name)) return 'northeast';
  if (NORTH.has(name)) return 'north';
  return null;
}

function colorFor(name, idx) {
  const group = groupOf(name);
  if (group) return GROUP_COLORS[group];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[(hash + idx) % PALETTE.length];
}

function segmentKey(fromName, toName) {
  return `${fromName}->${toName}`;
}

function buildFallbackPath(from, to) {
  const midX = (from.cx + to.cx) / 2;
  const midY = (from.cy + to.cy) / 2;
  const dx = to.cx - from.cx;
  const dy = to.cy - from.cy;
  const curveX = Math.abs(dy) * 0.18;
  const curveY = Math.abs(dx) * 0.12;
  return [
    `M ${from.cx} ${from.cy}`,
    `C ${from.cx + dx * 0.28 - curveX} ${from.cy + dy * 0.16 - curveY},`,
    `${midX + curveX} ${midY + curveY},`,
    `${to.cx} ${to.cy}`,
  ].join(' ');
}

function buildRoutePath(from, to) {
  const builder = ROUTE_PATH_BUILDERS[segmentKey(from.name, to.name)];
  return builder ? builder(from, to) : buildFallbackPath(from, to);
}

function easeInOut(value) {
  return 0.5 - Math.cos(Math.PI * value) / 2;
}

function animateValue(duration, onUpdate) {
  return new Promise((resolve) => {
    const start = performance.now();

    function frame(now) {
      const raw = Math.min((now - start) / duration, 1);
      onUpdate(easeInOut(raw));
      if (raw < 1) {
        requestAnimationFrame(frame);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}

function RoadBike({ position, rotation }) {
  if (!position) return null;

  return (
    <g
      className="india-path-biker"
      transform={`translate(${position.x} ${position.y}) rotate(${rotation}) scale(${BIKER_SCALE})`}
      pointerEvents="none"
    >
      <g transform="translate(-22 -16)">
        <circle cx="9" cy="20.8" r="5.6" className="quest-wheel" />
        <circle cx="34.8" cy="20.8" r="5.6" className="quest-wheel" />
        <circle cx="9" cy="20.8" r="1.9" className="quest-wheel-hub" />
        <circle cx="34.8" cy="20.8" r="1.9" className="quest-wheel-hub" />
        <path d="M9 20.8 L16.5 10.8 L28.8 10.8 L34.8 20.8 M16.5 10.8 L22.4 20.8 M22.4 20.8 L13.2 20.8 M28.8 10.8 L24.6 6.6" className="quest-bike-frame" />
        <path d="M24.2 6.8 L30.2 7.3" className="quest-bike-handle" />
        <path d="M15.7 9.2 L20.2 9.2" className="quest-bike-seat-line" />
        <ellipse cx="18.4" cy="4.1" rx="3.4" ry="3.9" className="quest-rider-head" />
        <path d="M17.8 7.9 L15.8 14.5 L21.8 14.5 L22.4 9.6 Z" className="quest-rider-body" />
        <path d="M16.1 14.4 L12 18.7 M20.8 14.3 L24.5 18.9 M21.6 10 L25.8 11.4" className="quest-rider-limbs" />
        <path d="M26.5 9.2 L31 11.3 L32.4 14.4 L28 13.9 Z" className="quest-dog-body" />
        <circle cx="33" cy="10.5" r="2.1" className="quest-dog-head" />
        <path d="M33.2 8.5 L34.8 7.3 L34.4 9.4 Z" className="quest-dog-ear" />
        <path d="M28.8 14.3 L27.9 17.3 M30.8 14.1 L30.5 17.2" className="quest-dog-legs" />
        <path d="M25.9 10.6 L23.8 9.3" className="quest-dog-tail" />
      </g>
    </g>
  );
}

export default function India3DMap({
  roleDetails,
  stateById,
  selectedStateId,
  onStateSelect,
  stateOrder = [],
  highestUnlockedIndex = 0,
}) {
  const [hovered, setHovered] = useState(null);
  const [completedSegments, setCompletedSegments] = useState(() => Math.max(0, highestUnlockedIndex));
  const [drawingSegmentIndex, setDrawingSegmentIndex] = useState(null);
  const [drawingProgress, setDrawingProgress] = useState(0);
  const [movingSegmentIndex, setMovingSegmentIndex] = useState(null);
  const [movingProgress, setMovingProgress] = useState(0);
  const [pathLengths, setPathLengths] = useState({});
  const pathRefs = useRef([]);
  const previousUnlockedIndex = useRef(Math.max(0, highestUnlockedIndex));
  const mapId = useId().replace(/:/g, '');

  const skillLookup = useMemo(() => {
    const pairs = (roleDetails?.state_requirements || []).map((req) => {
      const state = stateById.get(req.state_id);
      const mapName = INDIA_SKILL_STATES[req.state_id];
      if (!state || !mapName) return null;
      return [mapName, { id: req.state_id, title: state.title }];
    }).filter(Boolean);
    return new Map(pairs);
  }, [roleDetails, stateById]);

  const states = useMemo(() => INDIA_STATES.map((state, index) => {
    const [fill, shadow] = colorFor(state.name, index);
    const mappedSkill = skillLookup.get(state.name);
    return {
      ...state,
      fill: mappedSkill ? '#9ee86e' : fill,
      shadow: mappedSkill ? '#5ca236' : shadow,
      mappedSkill,
    };
  }), [skillLookup]);

  const topicStates = useMemo(
    () =>
      stateOrder.map((stateId, index) => {
        const mapName = INDIA_SKILL_STATES[stateId];
        const mapState = states.find((item) => item.name === mapName);
        const stateDetails = stateById.get(stateId);
        if (!mapState || !stateDetails) return null;
        return {
          index,
          id: stateId,
          title: stateDetails.title,
          name: mapState.name,
          cx: mapState.cx,
          cy: mapState.cy,
        };
      }).filter(Boolean),
    [stateById, stateOrder, states]
  );

  const routeSegments = useMemo(
    () =>
      topicStates.slice(0, -1).map((from, index) => {
        const to = topicStates[index + 1];
        return {
          index,
          from,
          to,
          d: buildRoutePath(from, to),
        };
      }),
    [topicStates]
  );

  const labelItems = useMemo(() => {
    const items = [];
    const seenGroup = new Set();
    for (const state of states) {
      const group = groupOf(state.name);
      if (group) {
        if (seenGroup.has(group)) continue;
        seenGroup.add(group);
        const members = states.filter((entry) => groupOf(entry.name) === group);
        items.push({
          key: `group-${group}`,
          cx: members.reduce((sum, entry) => sum + entry.cx, 0) / members.length,
          cy: members.reduce((sum, entry) => sum + entry.cy, 0) / members.length,
          shadow: state.shadow,
          label: group === 'north' ? 'N' : 'NE',
          group,
        });
      } else {
        items.push({
          key: state.name,
          cx: state.cx,
          cy: state.cy,
          shadow: state.shadow,
          label: state.mappedSkill ? state.mappedSkill.title : '',
          group: null,
          stateName: state.name,
          mappedSkill: state.mappedSkill,
        });
      }
    }
    return items;
  }, [states]);

  useEffect(() => {
    const nextLengths = {};
    routeSegments.forEach((segment, index) => {
      const pathNode = pathRefs.current[index];
      if (pathNode) {
        nextLengths[index] = pathNode.getTotalLength();
      }
    });
    setPathLengths(nextLengths);
  }, [routeSegments]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const nextIndex = Math.max(0, Math.min(highestUnlockedIndex, topicStates.length - 1));
      const previousIndex = previousUnlockedIndex.current;

      if (nextIndex <= previousIndex) {
        setCompletedSegments(nextIndex);
        setDrawingSegmentIndex(null);
        setDrawingProgress(0);
        setMovingSegmentIndex(null);
        setMovingProgress(0);
        previousUnlockedIndex.current = nextIndex;
        return;
      }

      for (let segmentIndex = previousIndex; segmentIndex < nextIndex; segmentIndex += 1) {
        if (cancelled) return;
        setDrawingSegmentIndex(segmentIndex);
        setDrawingProgress(0);
        await animateValue(DRAW_DURATION_MS, (value) => {
          if (!cancelled) setDrawingProgress(value);
        });
        if (cancelled) return;
        setCompletedSegments(segmentIndex + 1);
        setDrawingSegmentIndex(null);
        setMovingSegmentIndex(segmentIndex);
        setMovingProgress(0);
        await animateValue(MOVE_DURATION_MS, (value) => {
          if (!cancelled) setMovingProgress(value);
        });
        if (cancelled) return;
        setMovingSegmentIndex(null);
        setMovingProgress(0);
        previousUnlockedIndex.current = segmentIndex + 1;
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [highestUnlockedIndex, topicStates.length]);

  const bikerState = useMemo(() => {
    if (!topicStates.length) return null;

    if (movingSegmentIndex !== null) {
      const pathNode = pathRefs.current[movingSegmentIndex];
      const totalLength = pathLengths[movingSegmentIndex];
      if (pathNode && totalLength) {
        const currentLength = totalLength * movingProgress;
        const point = pathNode.getPointAtLength(currentLength);
        const tangentPoint = pathNode.getPointAtLength(Math.min(totalLength, currentLength + 1.5));
        return {
          position: { x: point.x, y: point.y },
          rotation: (Math.atan2(tangentPoint.y - point.y, tangentPoint.x - point.x) * 180) / Math.PI,
        };
      }
    }

    if (drawingSegmentIndex !== null) {
      const startNode = topicStates[drawingSegmentIndex];
      const nextNode = topicStates[drawingSegmentIndex + 1] || startNode;
      return {
        position: { x: startNode.cx, y: startNode.cy },
        rotation: (Math.atan2(nextNode.cy - startNode.cy, nextNode.cx - startNode.cx) * 180) / Math.PI,
      };
    }

    const activeNode = topicStates[Math.max(0, Math.min(highestUnlockedIndex, topicStates.length - 1))];
    const previousNode = topicStates[Math.max(0, Math.min(highestUnlockedIndex - 1, topicStates.length - 1))] || activeNode;
    return {
      position: { x: activeNode.cx, y: activeNode.cy },
      rotation: (Math.atan2(activeNode.cy - previousNode.cy, activeNode.cx - previousNode.cx || 1) * 180) / Math.PI,
    };
  }, [drawingSegmentIndex, highestUnlockedIndex, movingProgress, movingSegmentIndex, pathLengths, topicStates]);

  return (
    <div className="india-3d-map-shell">
      <div className="india-3d-map-stage">
        <svg
          viewBox="0 0 1000 1100"
          className="india-3d-map-svg"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="India 3D map"
        >
          <defs>
            <radialGradient id={`indiaSea-${mapId}`} cx="50%" cy="40%" r="80%">
              <stop offset="0%" stopColor="#eefbff" />
              <stop offset="100%" stopColor="#d9f2ff" />
            </radialGradient>
            <linearGradient id={`indiaShine-${mapId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <filter id={`indiaRoadGlow-${mapId}`} x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#6ab8e7" floodOpacity="0.28" />
            </filter>
          </defs>

          <rect width="1000" height="1100" fill={`url(#indiaSea-${mapId})`} rx="32" />
          <g opacity="0.22">
            {Array.from({ length: 30 }).map((_, row) =>
              Array.from({ length: 28 }).map((__, col) => (
                <circle key={`${row}-${col}`} cx={20 + col * 36} cy={20 + row * 36} r={1.4} fill="#ffffff" />
              ))
            )}
          </g>

          <g opacity="0.18" transform="translate(6 28)">
            {states.map((state) => (
              <path key={`cast-${state.name}`} d={state.d} fill="#133246" />
            ))}
          </g>

          {Array.from({ length: DEPTH_LAYERS }).map((_, layer) => {
            const offset = (DEPTH_LAYERS - layer) * DEPTH_STEP;
            return (
              <g key={`layer-${layer}`} transform={`translate(0 ${offset})`} pointerEvents="none">
                {states.map((state) => {
                  const group = groupOf(state.name);
                  const isHover = group ? hovered !== null && groupOf(hovered) === group : hovered === state.name;
                  const isActive = state.mappedSkill?.id === selectedStateId;
                  return (
                    <path
                      key={`depth-${layer}-${state.name}`}
                      d={state.d}
                      fill={state.shadow}
                      stroke={isActive ? '#1f5a96' : state.shadow}
                      strokeWidth={isActive ? 2 : 1}
                      strokeLinejoin="round"
                      style={{
                        transition: 'transform 350ms cubic-bezier(0.34,1.56,0.64,1)',
                        transform: isHover ? `translateY(-${HOVER_LIFT}px)` : 'translateY(0)',
                      }}
                    />
                  );
                })}
              </g>
            );
          })}

          {states.map((state, index) => {
            const group = groupOf(state.name);
            const isHover = group ? hovered !== null && groupOf(hovered) === group : hovered === state.name;
            const isActive = state.mappedSkill?.id === selectedStateId;
            return (
              <g
                key={state.name}
                onMouseEnter={() => setHovered(state.name)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => state.mappedSkill && onStateSelect(state.mappedSkill.id)}
                style={{
                  cursor: state.mappedSkill ? 'pointer' : 'default',
                  transition: 'transform 350ms cubic-bezier(0.34,1.56,0.64,1)',
                  transform: isHover ? `translateY(-${HOVER_LIFT}px)` : 'translateY(0)',
                  animation: 'indiaPopIn 0.8s cubic-bezier(0.34,1.56,0.64,1) both',
                  animationDelay: `${index * 35}ms`,
                }}
              >
                <path
                  d={state.d}
                  fill={state.fill}
                  stroke={group ? state.fill : isActive ? '#1f5a96' : 'white'}
                  strokeWidth={group ? 0.5 : isActive ? 4 : 2}
                  strokeLinejoin="round"
                  style={{
                    filter: isHover ? 'brightness(1.08) saturate(1.05)' : 'none',
                    transition: 'filter 200ms ease',
                  }}
                />
                <path d={state.d} fill={`url(#indiaShine-${mapId})`} pointerEvents="none" />
                <path d={state.d} fill="transparent" stroke="transparent" strokeWidth={8} />
              </g>
            );
          })}

          <g className="india-map-road-layer" filter={`url(#indiaRoadGlow-${mapId})`}>
            {routeSegments.map((segment) => {
              const length = pathLengths[segment.index] || 0;
              const isBuilt = segment.index < completedSegments;
              const isDrawing = segment.index === drawingSegmentIndex;
              const isMoving = segment.index === movingSegmentIndex;
              const isVisible = isBuilt || isDrawing || isMoving;
              if (!isVisible) return null;

              const progress = isDrawing ? drawingProgress : 1;
              const strokeStyle = length
                ? {
                    strokeDasharray: length,
                    strokeDashoffset: length * (1 - progress),
                  }
                : undefined;

              return (
                <g key={segmentKey(segment.from.id, segment.to.id)}>
                  <path
                    ref={(node) => {
                      pathRefs.current[segment.index] = node;
                    }}
                    d={segment.d}
                    className="india-topic-road-base"
                  />
                  <path d={segment.d} className="india-topic-road-lane" style={strokeStyle} />
                  <path d={segment.d} className="india-topic-road-progress" style={strokeStyle} />
                </g>
              );
            })}
          </g>

          <g className="india-map-city-layer">
            {topicStates.map((topic, index) => {
              const locked = index > highestUnlockedIndex;
              const active = index === highestUnlockedIndex;
              const completed = index < highestUnlockedIndex;
              return (
                <g
                  key={topic.id}
                  className={`india-map-city${completed ? ' completed' : ''}${active ? ' active' : ''}${locked ? ' locked' : ''}`}
                  transform={`translate(${topic.cx} ${topic.cy})`}
                >
                  <circle r="15" className="india-map-city-aura" />
                  <circle r="9" className="india-map-city-core" />
                  <circle r="4.2" className="india-map-city-dot" />
                </g>
              );
            })}
          </g>

          {labelItems.map((item, index) => {
            if (!item.label) return null;
            const isHover = item.group ? hovered !== null && groupOf(hovered) === item.group : hovered === item.stateName;
            const isActive = item.mappedSkill?.id === selectedStateId;
            return (
              <g
                key={`label-${item.key}`}
                pointerEvents="none"
                style={{
                  transition: 'transform 350ms cubic-bezier(0.34,1.56,0.64,1)',
                  transform: isHover ? `translateY(-${HOVER_LIFT}px)` : 'translateY(0)',
                  animation: 'indiaFadeUp 0.6s ease-out both',
                  animationDelay: `${800 + index * 25}ms`,
                }}
              >
                <rect
                  x={item.cx - 38}
                  y={item.cy - 13}
                  width={76}
                  height={24}
                  rx={12}
                  fill="#ffffff"
                  stroke={isActive ? '#1f5a96' : item.shadow}
                  strokeWidth={isActive ? 3 : 2}
                />
                <text
                  x={item.cx}
                  y={item.cy + 4}
                  textAnchor="middle"
                  fontFamily="'Nunito', system-ui, sans-serif"
                  fontWeight={800}
                  fontSize={item.group ? 11 : 10}
                  fill={isActive ? '#1f5a96' : item.shadow}
                >
                  {item.label.length > 12 ? `${item.label.slice(0, 10)}..` : item.label}
                </text>
              </g>
            );
          })}

          <RoadBike position={bikerState?.position} rotation={bikerState?.rotation || 0} />
        </svg>

        <div className="india-3d-map-badge">
          <span>India 3D Skill Map</span>
          <small>Roads build as each skill state unlocks</small>
        </div>

        {hovered && (
          <div className="india-3d-map-tooltip">
            <span>
              {groupOf(hovered) === 'northeast'
                ? 'North East India'
                : groupOf(hovered) === 'north'
                  ? 'North India'
                  : skillLookup.get(hovered)?.title || hovered}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
