import { useMemo, useState } from 'react';

export default function DebugChallenge({ city, onFinish }) {
  const challenge = useMemo(
    () => ({
      bug: `The quest in ${city.title} keeps failing because the final verification is skipped.`,
      fixes: [
        { id: 'a', text: 'Add the missing verification step before shipping', good: true },
        { id: 'b', text: 'Hide the error and continue to the next release', good: false },
        { id: 'c', text: 'Duplicate the same broken logic in another file', good: false },
      ],
    }),
    [city.title]
  );
  const [selected, setSelected] = useState('');

  return (
    <div className="minigame-shell">
      <span className="minigame-kicker">Debug Dungeon</span>
      <h3>{challenge.bug}</h3>
      <p className="muted">The bug gets nastier deeper in the dungeon. Choose the fix before the room timer defeats you.</p>
      <div className="minigame-options">
        {challenge.fixes.map((fix) => (
          <button
            key={fix.id}
            className={selected === fix.id ? 'minigame-option active' : 'minigame-option'}
            onClick={() => setSelected(fix.id)}
          >
            {fix.text}
          </button>
        ))}
      </div>
      <div className="minigame-actions">
        <button
          className="assessment-submit-btn"
          disabled={!selected}
          onClick={() => {
            const success = challenge.fixes.find((item) => item.id === selected)?.good;
            onFinish({
              success,
              xp: success ? 38 : 14,
              mistake: success ? '' : 'Debug challenge: picked an unsafe fix path',
            });
          }}
        >
          Escape Room
        </button>
      </div>
    </div>
  );
}
