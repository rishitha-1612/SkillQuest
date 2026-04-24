export default function SkillJourneyPanel({
  stateOrder,
  stateById,
  selectedStateId,
  unlockedIndex,
  assessments,
  onSelect,
}) {
  if (!stateOrder?.length) return null;

  const width = Math.max(760, 160 + stateOrder.length * 170);
  const roadStart = 84;
  const roadEnd = width - 84;
  const step = stateOrder.length > 1 ? (roadEnd - roadStart) / (stateOrder.length - 1) : 0;
  const passedCount = stateOrder.filter((stateId) => assessments[stateId]?.passed).length;
  const progressRatio = stateOrder.length > 1 ? passedCount / (stateOrder.length - 1) : 0;
  const bikeX = roadStart + (roadEnd - roadStart) * progressRatio;
  const currentStateId = stateOrder[Math.min(unlockedIndex, stateOrder.length - 1)];
  const nextStateId = stateOrder[Math.min(unlockedIndex + 1, stateOrder.length - 1)];

  return (
    <section className="game-window">
      <div className="window-bar">
        <span className="dot green" />
        <span className="dot yellow" />
        <span className="dot blue" />
        <strong>Rider Progress</strong>
      </div>
      <div className="window-body">
        <div className="rider-hud">
          <div className="rider-avatar">R</div>
          <div className="rider-copy">
            <strong>{stateById.get(currentStateId)?.title || 'Journey Start'}</strong>
            <span>Next stop: {stateById.get(nextStateId)?.title || 'Free roam'}</span>
          </div>
          <div className="rider-badge">
            <span>{passedCount}/{stateOrder.length} skills cleared</span>
          </div>
        </div>

        <div className="journey-road-shell">
          <svg className="journey-road-svg" viewBox={`0 0 ${width} 210`}>
            <path
              d={`M${roadStart} 122 C${roadStart + 100} 84, ${roadEnd - 140} 160, ${roadEnd} 122`}
              className="journey-road-path"
            />
            <path
              d={`M${roadStart} 122 C${roadStart + 100} 84, ${roadEnd - 140} 160, ${roadEnd} 122`}
              className="journey-road-path-glow"
              strokeDasharray={`${Math.max(0, progressRatio * 900)} 999`}
            />

            {stateOrder.map((stateId, index) => {
              const x = roadStart + step * index;
              const state = stateById.get(stateId);
              const passed = !!assessments[stateId]?.passed;
              const active = stateId === selectedStateId;
              const locked = index > unlockedIndex;
              return (
                <g
                  key={stateId}
                  className={`journey-stop${passed ? ' passed' : ''}${active ? ' active' : ''}${locked ? ' locked' : ''}`}
                  onClick={() => !locked && onSelect(stateId)}
                >
                  <circle cx={x} cy="122" r="24" className="journey-stop-core" />
                  <text x={x} y="127" textAnchor="middle" className="journey-stop-index">
                    {index + 1}
                  </text>
                  <text x={x} y="174" textAnchor="middle" className="journey-stop-title">
                    {state?.title || stateId}
                  </text>
                </g>
              );
            })}

            <g className="journey-bike" transform={`translate(${bikeX - 28} 56)`}>
              <rect width="56" height="30" rx="15" className="journey-bike-chip" />
              <text x="28" y="20" textAnchor="middle" className="journey-bike-text">
                Rider
              </text>
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}
