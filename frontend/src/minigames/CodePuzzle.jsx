import { useMemo, useState } from 'react';

export default function CodePuzzle({ city, onFinish }) {
  const challenge = useMemo(
    () => ({
      prompt: `You are in ${city.title}. Pick the cleanest code-focused action.`,
      options: [
        { id: 'a', text: 'Break the problem into smaller functions with clear names', good: true },
        { id: 'b', text: 'Add more nested conditionals in one giant function', good: false },
        { id: 'c', text: 'Skip tests and debug only in production', good: false },
      ],
    }),
    [city.title]
  );
  const [selected, setSelected] = useState('');

  return (
    <div className="minigame-shell">
      <span className="minigame-kicker">Code Puzzle</span>
      <h3>{challenge.prompt}</h3>
      <div className="minigame-options">
        {challenge.options.map((option) => (
          <button
            key={option.id}
            className={selected === option.id ? 'minigame-option active' : 'minigame-option'}
            onClick={() => setSelected(option.id)}
          >
            {option.text}
          </button>
        ))}
      </div>
      <div className="minigame-actions">
        <button
          className="assessment-submit-btn"
          disabled={!selected}
          onClick={() => {
            const success = challenge.options.find((item) => item.id === selected)?.good;
            onFinish({
              success,
              xp: success ? 35 : 12,
              mistake: success ? '' : 'Code puzzle: chose a weak engineering pattern',
            });
          }}
        >
          Submit Quest
        </button>
      </div>
    </div>
  );
}
