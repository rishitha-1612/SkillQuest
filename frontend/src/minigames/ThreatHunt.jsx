import { useMemo, useState } from 'react';

const ACTIONS = [
  'Block suspicious IP and rotate credentials',
  'Ignore spike because the server is still online',
  'Restart everything without preserving evidence',
];

export default function ThreatHunt({ city, onFinish }) {
  const stream = useMemo(
    () => [
      '03:12 login failure burst from 185.33.9.10',
      '03:13 token validation bypass attempt',
      '03:14 elevated permission request on admin route',
    ],
    []
  );
  const [choice, setChoice] = useState('');
  const success = choice === ACTIONS[0];

  return (
    <div className="minigame-shell">
      <span className="minigame-kicker">Threat Hunt</span>
      <h3>{`${city.title}: incident response simulation`}</h3>
      <div className="assessment-lock-note">
        <strong>Log stream</strong>
        <div>{stream.join('\n')}</div>
      </div>
      <div className="minigame-options">
        {ACTIONS.map((action) => (
          <button
            key={action}
            className={choice === action ? 'minigame-option active' : 'minigame-option'}
            onClick={() => setChoice(action)}
          >
            {action}
          </button>
        ))}
      </div>
      <div className="minigame-actions">
        <button
          className="assessment-submit-btn"
          disabled={!choice}
          onClick={() =>
            onFinish({
              success,
              xp: success ? 44 : 15,
              mistake: success ? '' : 'Threat Hunt: mitigation choice escalated risk or lost investigation signal',
            })
          }
        >
          Mitigate Incident
        </button>
      </div>
    </div>
  );
}
