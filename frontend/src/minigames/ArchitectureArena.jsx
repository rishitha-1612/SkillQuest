import { useMemo, useState } from 'react';

const COMPONENTS = ['Load Balancer', 'CDN', 'App Service', 'Queue', 'Object Storage', 'Primary DB'];

export default function ArchitectureArena({ city, onFinish }) {
  const scenario = useMemo(
    () => ({
      title: '10M users • image upload • real-time feed',
      mustHave: ['Load Balancer', 'CDN', 'Queue', 'Primary DB'],
    }),
    []
  );
  const [selected, setSelected] = useState([]);

  function toggle(part) {
    setSelected((current) =>
      current.includes(part) ? current.filter((item) => item !== part) : [...current, part]
    );
  }

  const matched = scenario.mustHave.filter((item) => selected.includes(item)).length;
  const success = matched >= 3 && selected.includes('App Service');

  return (
    <div className="minigame-shell">
      <span className="minigame-kicker">Architecture Arena</span>
      <h3>{`${city.title}: design for ${scenario.title}`}</h3>
      <p className="muted">Pick the components that make the system scalable, resilient, and cost-aware.</p>
      <div className="minigame-options">
        {COMPONENTS.map((part) => (
          <button
            key={part}
            className={selected.includes(part) ? 'minigame-option active' : 'minigame-option'}
            onClick={() => toggle(part)}
          >
            {part}
          </button>
        ))}
      </div>
      <div className="mission-rank-strip">
        <article className="mission-rank-card">
          <span>Scalability</span>
          <strong>{`${matched}/4`}</strong>
        </article>
        <article className="mission-rank-card">
          <span>Judge</span>
          <strong>{success ? 'Approved' : 'Needs redesign'}</strong>
        </article>
      </div>
      <div className="minigame-actions">
        <button
          className="assessment-submit-btn"
          disabled={!selected.length}
          onClick={() =>
            onFinish({
              success,
              xp: success ? 46 : 18,
              mistake: success ? '' : 'Architecture Arena: weak component choices for scale or resilience',
            })
          }
        >
          Submit Architecture
        </button>
      </div>
    </div>
  );
}
