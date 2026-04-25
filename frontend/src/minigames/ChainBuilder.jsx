import { useMemo, useState } from 'react';

const CLAUSES = [
  'Only owner can withdraw treasury',
  'Anyone can drain contract after deploy',
  'Validate recipient address and amount',
  'Skip checks to reduce gas',
];

export default function ChainBuilder({ city, onFinish }) {
  const [selected, setSelected] = useState([]);
  const requirement = useMemo(
    () => 'Build a safe treasury payout contract for a DAO grant flow.',
    []
  );

  function toggle(clause) {
    setSelected((current) =>
      current.includes(clause) ? current.filter((item) => item !== clause) : [...current, clause]
    );
  }

  const success =
    selected.includes('Only owner can withdraw treasury') &&
    selected.includes('Validate recipient address and amount') &&
    !selected.includes('Anyone can drain contract after deploy') &&
    !selected.includes('Skip checks to reduce gas');

  return (
    <div className="minigame-shell">
      <span className="minigame-kicker">Chain Builder</span>
      <h3>{requirement}</h3>
      <div className="minigame-options">
        {CLAUSES.map((clause) => (
          <button
            key={clause}
            className={selected.includes(clause) ? 'minigame-option active' : 'minigame-option'}
            onClick={() => toggle(clause)}
          >
            {clause}
          </button>
        ))}
      </div>
      <div className="assessment-lock-note">
        <strong>Exploit warning</strong>
        <div>{success ? 'No exploit path found.' : 'Unsafe clauses would let an attacker drain or misuse funds.'}</div>
      </div>
      <div className="minigame-actions">
        <button
          className="assessment-submit-btn"
          disabled={!selected.length}
          onClick={() =>
            onFinish({
              success,
              xp: success ? 45 : 16,
              mistake: success ? '' : 'Chain Builder: unsafe smart-contract logic allowed exploit conditions',
            })
          }
        >
          Deploy Contract
        </button>
      </div>
    </div>
  );
}
