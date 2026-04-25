import { useMemo, useState } from 'react';

function moveItem(list, fromIndex, toIndex) {
  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export default function DragDropLogic({ city, onFinish }) {
  const target = useMemo(
    () => ['Understand', 'Apply', 'Validate'],
    []
  );
  const [steps, setSteps] = useState(['Validate', 'Understand', 'Apply']);

  const isCorrect = steps.every((item, index) => item === target[index]);

  return (
    <div className="minigame-shell">
      <span className="minigame-kicker">Challenge Game</span>
      <h3>{`Put the ${city.title} flow into the strongest order.`}</h3>
      <p className="muted">Use the arrows to reorder the learning logic.</p>
      <div className="logic-stack">
        {steps.map((step, index) => (
          <article key={step} className="logic-chip">
            <strong>{step}</strong>
            <div className="logic-chip-actions">
              <button
                className="assessment-ghost-btn"
                disabled={index === 0}
                onClick={() => setSteps((current) => moveItem(current, index, index - 1))}
              >
                Up
              </button>
              <button
                className="assessment-ghost-btn"
                disabled={index === steps.length - 1}
                onClick={() => setSteps((current) => moveItem(current, index, index + 1))}
              >
                Down
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="minigame-actions">
        <button
          className="assessment-submit-btn"
          onClick={() =>
            onFinish({
              success: isCorrect,
              xp: isCorrect ? 40 : 15,
              mistake: isCorrect ? '' : 'Challenge game: learning sequence was not ordered correctly',
            })
          }
        >
          Lock Order
        </button>
      </div>
    </div>
  );
}
