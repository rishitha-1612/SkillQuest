export default function LeaderboardPanel({
  isOpen,
  onClose,
  level,
  xp,
  streakCount,
  prestigeTier,
  totalRealms,
}) {
  return (
    <div className={`overlay-panel from-left leaderboard-panel${isOpen ? ' open' : ''}`}>
      <div className="overlay-panel-header">
        <h2>Your Stats</h2>
        <button type="button" className="overlay-close-btn" onClick={onClose} aria-label="Close">
          x
        </button>
      </div>

      <div className="overlay-panel-body">
        <div className="stats-grid">
          <div className="stat-card">
            <span>Level</span>
            <strong>{level}</strong>
          </div>

          <div className="stat-card">
            <span>XP</span>
            <strong>{xp}</strong>
          </div>

          <div className="stat-card">
            <span>Rank</span>
            <strong>{prestigeTier}</strong>
          </div>

          <div className="stat-card">
            <span>Streak</span>
            <strong>{streakCount} days</strong>
          </div>

          <div className="stat-card">
            <span>Total Realms</span>
            <strong>{totalRealms}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
