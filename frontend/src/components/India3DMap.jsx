import { useMemo, useState } from 'react';
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
  data_visualization: 'West Bengal',
};

const DEPTH_LAYERS = 10;
const DEPTH_STEP = 1.4;
const HOVER_LIFT = 14;

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

export default function India3DMap({ roleDetails, stateById, selectedStateId, onStateSelect }) {
  const [hovered, setHovered] = useState(null);

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
            <radialGradient id="indiaSea" cx="50%" cy="40%" r="80%">
              <stop offset="0%" stopColor="#eefbff" />
              <stop offset="100%" stopColor="#d9f2ff" />
            </radialGradient>
            <linearGradient id="indiaShine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          <rect width="1000" height="1100" fill="url(#indiaSea)" rx="32" />
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
                  animation: `indiaPopIn 0.8s cubic-bezier(0.34,1.56,0.64,1) both`,
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
                <path d={state.d} fill="url(#indiaShine)" pointerEvents="none" />
                <path d={state.d} fill="transparent" stroke="transparent" strokeWidth={8} />
              </g>
            );
          })}

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
                  animation: `indiaFadeUp 0.6s ease-out both`,
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
        </svg>

        <div className="india-3d-map-badge">
          <span>India 3D Skill Map</span>
          <small>Click highlighted states to switch skills</small>
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
