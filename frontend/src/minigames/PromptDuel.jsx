import { useMemo, useState } from 'react';

export default function PromptDuel({ city, onFinish }) {
  const [prompt, setPrompt] = useState('');
  const challenge = useMemo(
    () => ({
      task: 'Generate a bug triage summary with priority, cause, and next action.',
      expert: 'You are a senior triage assistant. Summarize the bug in 3 bullets: priority, likely root cause, and next action. Keep it concise and actionable.',
    }),
    []
  );

  const score =
    (prompt.toLowerCase().includes('priority') ? 30 : 0) +
    (prompt.toLowerCase().includes('cause') || prompt.toLowerCase().includes('root') ? 30 : 0) +
    (prompt.toLowerCase().includes('action') || prompt.toLowerCase().includes('next') ? 20 : 0) +
    (prompt.length > 70 ? 20 : 0);
  const success = score >= 75;

  return (
    <div className="minigame-shell">
      <span className="minigame-kicker">Prompt Duel</span>
      <h3>{`${city.title}: write the strongest prompt`}</h3>
      <p className="muted">{challenge.task}</p>
      <textarea
        className="tutor-chat-input"
        rows={5}
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Write a clear, specific prompt..."
      />
      <div className="mission-rank-strip">
        <article className="mission-rank-card">
          <span>AI Judge</span>
          <strong>{`${score}/100`}</strong>
        </article>
        <article className="mission-rank-card">
          <span>Expert Prompt</span>
          <strong>{success ? 'Unlocked' : 'Reveal after submit'}</strong>
        </article>
      </div>
      <div className="assessment-lock-note">
        <strong>Expert prompt</strong>
        <div>{challenge.expert}</div>
      </div>
      <div className="minigame-actions">
        <button
          className="assessment-submit-btn"
          disabled={!prompt.trim()}
          onClick={() =>
            onFinish({
              success,
              xp: success ? 42 : 16,
              mistake: success ? '' : 'Prompt Duel: prompt lacked clarity, structure, or required constraints',
            })
          }
        >
          Duel the Judge
        </button>
      </div>
    </div>
  );
}
