export default function HelpPanel({ isOpen, onClose, lockedRegions }) {
  return (
    <div className={`overlay-panel help-panel${isOpen ? ' open' : ''}`}>
      <div className="overlay-panel-header">
        <h2>How It Works</h2>
        <button type="button" className="overlay-close-btn" onClick={onClose} aria-label="Close">
          x
        </button>
      </div>

      <div className="overlay-panel-body help-content">
        <p>
          <strong>Learn, play, and clear boss battles.</strong>
        </p>

        <p>Pick a realm, clear city games, unlock the next state.</p>

        <h3>The Three-Step Loop</h3>
        <ol>
          <li>Select a realm (country) from the globe</li>
          <li>Complete city games to learn skills</li>
          <li>Unlock the next state and progress</li>
        </ol>

        {lockedRegions && lockedRegions.length > 0 && (
          <div className="help-locked-section">
            <h3>Locked Regions</h3>
            <p className="muted">{lockedRegions.join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
