import React from 'react';

function buildLevels(nodes, edges) {
  const indeg = new Map(nodes.map((n) => [n.id, 0]));
  const outgoing = new Map(nodes.map((n) => [n.id, []]));

  edges.forEach(([a, b]) => {
    if (outgoing.has(a) && indeg.has(b)) {
      outgoing.get(a).push(b);
      indeg.set(b, indeg.get(b) + 1);
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

function DagView({ state }) {
  const nodes = state.nodes || [];
  const edges = state.edges || [];
  if (!nodes.length) return <p className="muted">No pathway data.</p>;

  const levels = buildLevels(nodes, edges);
  const grouped = new Map();
  nodes.forEach((n) => {
    const l = levels.get(n.id) || 0;
    if (!grouped.has(l)) grouped.set(l, []);
    grouped.get(l).push(n);
  });

  const cols = [...grouped.keys()].sort((a, b) => a - b);
  const w = Math.max(760, 140 + cols.length * 170);
  const maxRows = Math.max(...cols.map((c) => grouped.get(c).length));
  const h = Math.max(260, 80 + maxRows * 84);
  const pos = new Map();

  cols.forEach((c, colI) => {
    grouped.get(c).forEach((node, rowI) => {
      pos.set(node.id, { x: 80 + colI * 170, y: 60 + rowI * 82 });
    });
  });

  return (
    <div className="dag-shell">
      <svg width={w} height={h}>
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#6ed9ff" />
          </marker>
        </defs>
        {edges.map(([from, to]) => {
          const a = pos.get(from);
          const b = pos.get(to);
          if (!a || !b) return null;
          return (
            <line
              key={`${from}-${to}`}
              x1={a.x + 62}
              y1={a.y}
              x2={b.x - 62}
              y2={b.y}
              className="dag-edge"
              markerEnd="url(#arrow)"
            />
          );
        })}
        {nodes.map((n) => {
          const p = pos.get(n.id);
          return (
            <g key={n.id}>
              <rect x={p.x - 62} y={p.y - 24} width="124" height="48" rx="16" className="dag-node" />
              <text x={p.x} y={p.y + 4} textAnchor="middle" className="dag-label">{n.title}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function StatePathwayPanel({ stateDetails }) {
  if (!stateDetails) {
    return (
      <section className="panel-card">
        <h2>Mission Pathway</h2>
        <p className="muted">Open a province.</p>
      </section>
    );
  }

  const totalXp = stateDetails.nodes.reduce((sum, node) => sum + node.xp_reward, 0);

  return (
    <section className="panel-card">
      <div className="panel-kicker">Province Route</div>
      <h2>{stateDetails.title}</h2>
      <p className="muted">Clear each city in order.</p>
      <div className="mini-stats">
        <article>
          <span>Cities</span>
          <strong>{stateDetails.nodes.length}</strong>
        </article>
        <article>
          <span>Total XP</span>
          <strong>{totalXp}</strong>
        </article>
      </div>
      <DagView state={stateDetails} />
      <div className="city-list">
        {stateDetails.nodes.map((node) => (
          <article key={node.id} className="city-card">
            <h4>{node.title}</h4>
            <p>{node.description}</p>
            <small>{node.type} • {node.estimated_time_minutes} mins • {node.xp_reward} XP</small>
          </article>
        ))}
      </div>
    </section>
  );
}
