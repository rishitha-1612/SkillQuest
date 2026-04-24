import { useEffect, useMemo, useState } from 'react';
import { buildAssessmentQuestions } from '../data/assessmentGenerator';

function getStatus(index, visited, answers) {
  if (answers[index] !== undefined) return 'answered';
  if (visited.has(index)) return 'opened';
  return 'idle';
}

export default function AssessmentWindow({ stateDetails, existingResult, onAssessmentComplete }) {
  const [attemptSeed, setAttemptSeed] = useState(() => Date.now());
  const questions = useMemo(
    () => buildAssessmentQuestions(stateDetails, attemptSeed),
    [stateDetails, attemptSeed]
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visited, setVisited] = useState(new Set([0]));
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(existingResult || null);

  useEffect(() => {
    setAttemptSeed(Date.now());
    setCurrentIndex(0);
    setVisited(new Set([0]));
    setAnswers({});
    setResult(existingResult || null);
  }, [stateDetails?.state_id, existingResult]);

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
          <p className="muted">Open a skill to start its 25-question assessment.</p>
        </div>
      </section>
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  function openQuestion(index) {
    setCurrentIndex(index);
    setVisited((prev) => new Set(prev).add(index));
  }

  function chooseAnswer(value) {
    setAnswers((prev) => ({ ...prev, [currentIndex]: value }));
  }

  function submitAssessment() {
    const correctCount = questions.reduce(
      (sum, question, index) => sum + (answers[index] === question.correctAnswer ? 1 : 0),
      0
    );
    const score = Math.round((correctCount / questions.length) * 100);
    const nextResult = {
      score,
      correctCount,
      totalQuestions: questions.length,
      passed: score >= 75,
    };
    setResult(nextResult);
    onAssessmentComplete(nextResult);
  }

  function resetAttempt() {
    setAttemptSeed(Date.now() + Math.floor(Math.random() * 10000));
    setCurrentIndex(0);
    setVisited(new Set([0]));
    setAnswers({});
    setResult(null);
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
            <strong>25 questions</strong>
            <p className="muted">Score 75% or higher to unlock the next skill.</p>
          </div>
          <div className="assessment-progress-pill">
            <span>{answeredCount}/25 answered</span>
          </div>
        </div>

        {result && (
          <div className={result.passed ? 'assessment-result pass' : 'assessment-result fail'}>
            <strong>{result.passed ? 'Gate Cleared' : 'Try Again'}</strong>
            <span>{result.correctCount}/{result.totalQuestions} correct</span>
            <span>{result.score}%</span>
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
              <span>Question {currentQuestion.index}</span>
              <strong>{stateDetails.title}</strong>
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
                onClick={submitAssessment}
                disabled={answeredCount < questions.length}
              >
                Submit Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
