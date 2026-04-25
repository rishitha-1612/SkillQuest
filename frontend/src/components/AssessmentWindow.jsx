import { useEffect, useMemo, useState } from 'react';
import { buildAssessmentQuestions, getAssessmentQuestionBankSize } from '../data/assessmentGenerator';

const WAVE_CONFIG = [
  { id: 1, label: 'Wave 1', range: [0, 6], timer: 35, bossMode: 'Full HP opener' },
  { id: 2, label: 'Wave 2', range: [7, 21], timer: 24, bossMode: 'Enraged timer phase' },
  { id: 3, label: 'Wave 3', range: [22, 29], timer: 18, bossMode: 'Last stand' },
];

function getStatus(index, visited, answers) {
  if (answers[index] !== undefined) return 'answered';
  if (visited.has(index)) return 'opened';
  return 'idle';
}

function getWaveForQuestion(index) {
  return WAVE_CONFIG.find((wave) => index >= wave.range[0] && index <= wave.range[1]) || WAVE_CONFIG[2];
}

export default function AssessmentWindow({
  stateDetails,
  existingResult,
  onAssessmentComplete,
  integrityFailed = false,
  onResetIntegrity,
}) {
  const [attemptSeed, setAttemptSeed] = useState(() => Date.now());
  const questions = useMemo(
    () => buildAssessmentQuestions(stateDetails, attemptSeed),
    [stateDetails, attemptSeed]
  );
  const questionBankSize = useMemo(
    () => getAssessmentQuestionBankSize(stateDetails),
    [stateDetails]
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visited, setVisited] = useState(new Set([0]));
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(existingResult || null);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [bossHealth, setBossHealth] = useState(100);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(35);
  const activeWave = getWaveForQuestion(currentIndex);

  useEffect(() => {
    setAttemptSeed(Date.now());
    setCurrentIndex(0);
    setVisited(new Set([0]));
    setAnswers({});
    setResult(existingResult || null);
    setPlayerHealth(existingResult?.passed ? 100 : 100);
    setBossHealth(existingResult?.passed ? 0 : 100);
    setQuestionTimeLeft(WAVE_CONFIG[0].timer);
  }, [stateDetails?.state_id, existingResult]);

  useEffect(() => {
    if (result) return undefined;
    const timer = window.setInterval(() => {
      setQuestionTimeLeft((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          handleBossStrike(false, true);
          return getWaveForQuestion(currentIndex).timer;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [currentIndex, result]);

  useEffect(() => {
    if (integrityFailed && !result?.reason) {
      const nextResult = {
        score: 0,
        correctCount: 0,
        totalQuestions: questions.length || 30,
        passed: false,
        reason: 'Attempt failed: tab switching detected.',
      };
      setResult(nextResult);
      onAssessmentComplete(nextResult);
      onResetIntegrity?.();
    }
  }, [integrityFailed, onAssessmentComplete, onResetIntegrity, questions.length, result]);

  if (!stateDetails) {
    return (
      <section className="game-window">
        <div className="window-bar">
          <span className="dot green" />
          <span className="dot yellow" />
          <span className="dot blue" />
          <strong>Assessment Gate</strong>
        </div>
        <div className="window-body">
          <p className="muted">Open a skill to start its 30-question boss assessment.</p>
        </div>
      </section>
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const waveQuestionIndex = currentIndex - activeWave.range[0] + 1;
  const waveQuestionTotal = activeWave.range[1] - activeWave.range[0] + 1;

  function openQuestion(index) {
    setCurrentIndex(index);
    setVisited((prev) => new Set(prev).add(index));
    setQuestionTimeLeft(getWaveForQuestion(index).timer);
  }

  function chooseAnswer(value) {
    setAnswers((prev) => ({ ...prev, [currentIndex]: value }));
  }

  function handleBossStrike(forcedCorrect, timedOut = false) {
    if (result) return;
    const selected = answers[currentIndex];
    const correct = forcedCorrect ?? selected === currentQuestion.correctAnswer;
    const baseDamage = Math.ceil(100 / questions.length);
    const bossDamage = correct ? (activeWave.id === 3 ? Math.ceil(baseDamage * 1.5) : baseDamage) : 0;
    const playerDamage = correct ? 0 : (activeWave.id === 3 ? baseDamage * 2 : baseDamage);
    const nextBoss = Math.max(0, bossHealth - bossDamage);
    const nextPlayer = Math.max(0, playerHealth - playerDamage);

    setBossHealth(nextBoss);
    setPlayerHealth(nextPlayer);

    if (timedOut) {
      setAnswers((prev) => ({ ...prev, [currentIndex]: '__timeout__' }));
    }

    const atLastQuestion = currentIndex === questions.length - 1;
    if (nextBoss <= 0 || nextPlayer <= 0 || atLastQuestion) {
      const correctCount = questions.reduce(
        (sum, question, index) => sum + (answers[index] === question.correctAnswer ? 1 : 0),
        0
      ) + (correct && answers[currentIndex] !== currentQuestion.correctAnswer ? 1 : 0);
      const score = Math.round((correctCount / questions.length) * 100);
      const nextResult = {
        score,
        correctCount,
        totalQuestions: questions.length,
        passed: nextBoss <= 0 || score >= 75,
        reason: nextPlayer <= 0 ? 'Your health reached zero before the boss fell.' : undefined,
      };
      setResult(nextResult);
      onAssessmentComplete(nextResult);
      return;
    }

    openQuestion(Math.min(currentIndex + 1, questions.length - 1));
    setQuestionTimeLeft(getWaveForQuestion(Math.min(currentIndex + 1, questions.length - 1)).timer);
  }

  function resetAttempt() {
    onResetIntegrity?.();
    setAttemptSeed(Date.now() + Math.floor(Math.random() * 10000));
    setCurrentIndex(0);
    setVisited(new Set([0]));
    setAnswers({});
    setResult(null);
    setPlayerHealth(100);
    setBossHealth(100);
    setQuestionTimeLeft(WAVE_CONFIG[0].timer);
  }

  return (
    <section className="game-window assessment-window">
      <div className="window-bar">
        <span className="dot green" />
        <span className="dot yellow" />
        <span className="dot blue" />
        <strong>{stateDetails.title} Assessment</strong>
      </div>
      <div className="window-body assessment-body">
        <div className="assessment-topline">
          <div>
            <strong>Boss Battle</strong>
            <p className="muted">{`3 waves. 30 questions drawn from a ${questionBankSize || 100}-question subject bank. Break the boss before your health reaches zero.`}</p>
          </div>
          <div className="assessment-progress-pill">
            <span>{`${answeredCount}/${questions.length || 30} moves made`}</span>
          </div>
        </div>

        <div className="battle-bars">
          <article className="battle-bar-card player">
            <span>Player HP</span>
            <div className="battle-bar-track">
              <div className="battle-bar-fill player" style={{ width: `${playerHealth}%` }} />
            </div>
            <strong>{playerHealth}</strong>
          </article>
          <article className="battle-bar-card boss">
            <span>Boss HP</span>
            <div className="battle-bar-track">
              <div className="battle-bar-fill boss" style={{ width: `${bossHealth}%` }} />
            </div>
            <strong>{bossHealth}</strong>
          </article>
          <article className="battle-bar-card timer">
            <span>Turn Timer</span>
            <strong>{`${questionTimeLeft}s`}</strong>
          </article>
        </div>

        <div className="mission-rank-strip">
          {WAVE_CONFIG.map((wave) => (
            <article
              key={wave.id}
              className={`mission-rank-card${wave.id === activeWave.id ? ' mission-card-accent' : ''}`}
            >
              <span>{wave.label}</span>
              <strong>{`${wave.range[1] - wave.range[0] + 1} questions`}</strong>
            </article>
          ))}
        </div>

        {result && (
          <div className={result.passed ? 'assessment-result pass' : 'assessment-result fail'}>
            <strong>{result.passed ? 'Boss Defeated' : 'Boss Won'}</strong>
            <span>{result.correctCount}/{result.totalQuestions} correct</span>
            <span>{result.score}%</span>
            {result.reason && <span>{result.reason}</span>}
            <button className="assessment-ghost-btn" onClick={resetAttempt}>
              Retake
            </button>
          </div>
        )}

        <div className="assessment-layout">
          <aside className="assessment-nav">
            <div className="assessment-nav-grid">
              {questions.map((question, index) => {
                const status = getStatus(index, visited, answers);
                const active = index === currentIndex;
                return (
                  <button
                    key={question.id}
                    className={`assessment-index ${status}${active ? ' active' : ''}`}
                    onClick={() => openQuestion(index)}
                  >
                    {question.index}
                  </button>
                );
              })}
            </div>
            <div className="assessment-legend">
              <span><i className="answered" /> answered</span>
              <span><i className="opened" /> opened</span>
              <span><i className="idle" /> not opened</span>
            </div>
          </aside>

          <div className="assessment-card">
            <div className="assessment-card-head">
              <span>{`${activeWave.label} - Q${waveQuestionIndex}/${waveQuestionTotal}`}</span>
              <strong>{`${stateDetails.title} - ${activeWave.bossMode}`}</strong>
            </div>
            <h3>{currentQuestion.prompt}</h3>
            <div className="assessment-options">
              {currentQuestion.options.map((option) => (
                <button
                  key={option}
                  className={answers[currentIndex] === option ? 'assessment-option active' : 'assessment-option'}
                  onClick={() => chooseAnswer(option)}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="assessment-actions">
              <button
                className="assessment-ghost-btn"
                onClick={() => openQuestion(Math.max(currentIndex - 1, 0))}
                disabled={currentIndex === 0}
              >
                Previous
              </button>
              <button
                className="assessment-ghost-btn"
                onClick={() => openQuestion(Math.min(currentIndex + 1, questions.length - 1))}
                disabled={currentIndex === questions.length - 1}
              >
                Next
              </button>
              <button
                className="assessment-submit-btn"
                onClick={() => handleBossStrike(undefined, false)}
                disabled={answers[currentIndex] === undefined || !!result}
              >
                Attack Boss
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
