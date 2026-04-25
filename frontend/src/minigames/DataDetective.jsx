import { useMemo, useState } from 'react';

const QUERIES = [
  'SELECT month, revenue FROM sales ORDER BY month;',
  'SELECT month, region, returns FROM returns WHERE month = \'March\';',
  'SELECT campaign, spend, conversion_rate FROM marketing WHERE month = \'March\';',
];

export default function DataDetective({ city, onFinish }) {
  const caseFile = useMemo(
    () => ({
      mystery: 'Sales dropped 30% in March. Find the likely root cause.',
      answer: 'A paid campaign overspent while conversion rate dropped and returns spiked in one region.',
    }),
    []
  );
  const [selectedQueries, setSelectedQueries] = useState([]);
  const [hypothesis, setHypothesis] = useState('');
  const success =
    selectedQueries.length >= 2 &&
    /campaign|conversion|returns|region/i.test(hypothesis);

  function toggle(query) {
    setSelectedQueries((current) =>
      current.includes(query) ? current.filter((item) => item !== query) : [...current, query]
    );
  }

  return (
    <div className="minigame-shell">
      <span className="minigame-kicker">Data Detective</span>
      <h3>{caseFile.mystery}</h3>
      <div className="logic-stack">
        {QUERIES.map((query) => (
          <button
            key={query}
            className={selectedQueries.includes(query) ? 'logic-chip active' : 'logic-chip'}
            onClick={() => toggle(query)}
          >
            <strong>{query}</strong>
          </button>
        ))}
      </div>
      <textarea
        className="tutor-chat-input"
        rows={4}
        value={hypothesis}
        onChange={(event) => setHypothesis(event.target.value)}
        placeholder="Write your root-cause summary..."
      />
      <div className="assessment-lock-note">
        <strong>Case resolution</strong>
        <div>{caseFile.answer}</div>
      </div>
      <div className="minigame-actions">
        <button
          className="assessment-submit-btn"
          disabled={!hypothesis.trim()}
          onClick={() =>
            onFinish({
              success,
              xp: success ? 48 : 18,
              mistake: success ? '' : 'Data Detective: root cause or query path missed the strongest signal',
            })
          }
        >
          Close Case
        </button>
      </div>
    </div>
  );
}
