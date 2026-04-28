import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { getClusterTheme, getRoleWorldProfile } from '../data/worldConfig';
import { isLearningRequirementComplete } from '../data/learningResources';
import AssessmentWindow from './AssessmentWindow';
import { clearAssessmentLock, setAssessmentLock } from '../data/assessmentLock';

function loadCountryProgress(countryId) {
  try {
    const raw = window.localStorage.getItem(`skillquest-progress:${countryId}`);
    if (!raw) return { highestUnlockedIndex: 0, assessments: {} };
    return JSON.parse(raw);
  } catch {
    return { highestUnlockedIndex: 0, assessments: {} };
  }
}

function saveCountryProgress(countryId, progress) {
  window.localStorage.setItem(`skillquest-progress:${countryId}`, JSON.stringify(progress));
}

export default function AssessmentRouteWindow({ countryId, stateId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleDetails, setRoleDetails] = useState(null);
  const [stateDetails, setStateDetails] = useState(null);
  const [progress, setProgress] = useState(() => loadCountryProgress(countryId));
  const [windowId] = useState(() => `assessment-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [integrityFailed, setIntegrityFailed] = useState(false);

  useEffect(() => {
    setProgress(loadCountryProgress(countryId));
  }, [countryId]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [role, state] = await Promise.all([
          api.roleDetails(countryId),
          api.stateDetails(stateId),
        ]);
        setRoleDetails(role);
        setStateDetails(state);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [countryId, stateId]);

  useEffect(() => {
    saveCountryProgress(countryId, progress);
  }, [countryId, progress]);

  useEffect(() => {
    setAssessmentLock(true, { windowId, countryId, stateId });

    function onVisibility() {
      if (document.hidden) {
        setIntegrityFailed(true);
      }
    }

    function onBeforeUnload() {
      clearAssessmentLock(windowId);
    }

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onBeforeUnload);
      clearAssessmentLock(windowId);
    };
  }, [countryId, stateId, windowId]);

  const profile = getRoleWorldProfile(countryId);
  const theme = getClusterTheme(roleDetails?.continent_id || 'ai_data');
  const existingResult = progress.assessments?.[stateId] || null;
  const learningComplete = isLearningRequirementComplete(stateDetails, progress);
  const routeComplete = Boolean(
    stateDetails?.nodes?.length &&
      stateDetails.nodes.every((node) => (progress.completedCities?.[stateId] || []).includes(node.id))
  );
  const assessmentUnlocked = learningComplete && routeComplete;

  function handleAssessmentComplete(result) {
    const stateOrder = roleDetails?.state_requirements?.map((req) => req.state_id) || [];
    const currentIndex = stateOrder.indexOf(stateId);
    setProgress((prev) => {
      const nextAssessments = {
        ...(prev.assessments || {}),
        [stateId]: result,
      };
      const nextHighest = result.passed
        ? Math.min(Math.max(prev.highestUnlockedIndex || 0, currentIndex + 1), Math.max(0, stateOrder.length - 1))
        : prev.highestUnlockedIndex || 0;
      return {
        highestUnlockedIndex: nextHighest,
        assessments: nextAssessments,
      };
    });
  }

  return (
    <div
      className="country-window-root assessment-route-root"
      style={{
        '--theme-accent': theme.accent,
        '--theme-glow': theme.glow,
        '--theme-atmosphere': theme.atmosphere,
      }}
    >
      <header className="country-hero">
        <div>
          <p className="eyebrow">Assessment Window</p>
          <h1>{stateDetails?.title || 'Assessment Gate'}</h1>
          <p className="hero-text">{`${profile.countryName} • ${roleDetails?.title || countryId}`}</p>
        </div>
        <div className="hero-stats country-hero-stats">
          <article className="stat-card">
            <span>Format</span>
            <strong>30 MCQ</strong>
          </article>
          <article className="stat-card">
            <span>Pass Mark</span>
            <strong>75%</strong>
          </article>
          <article className="stat-card">
            <span>Window</span>
            <strong>Assessment</strong>
          </article>
          <article className="stat-card">
            <span>Status</span>
            <strong>{existingResult?.passed ? `Passed ${existingResult.score}%` : 'Ready'}</strong>
          </article>
        </div>
      </header>

      {loading && <div className="banner">Loading assessment...</div>}
      {!!error && <div className="banner error">{error}</div>}

      <main className="assessment-route-layout">
        <section className="game-window">
          <div className="window-bar">
            <span className="dot green" />
            <span className="dot yellow" />
            <span className="dot blue" />
            <strong>Assessment Brief</strong>
          </div>
          <div className="window-body">
            <p className="panel-summary">
              Finish the skill route, then take this assessment. Each attempt pulls a fresh 30-question mix from a 100-question bank using 7 easy, 15 medium, and 8 hard questions.
            </p>
            <div className="mini-stats">
              <article>
                <span>Skill</span>
                <strong>{stateDetails?.title || 'Loading'}</strong>
              </article>
              <article>
                <span>Retakes</span>
                <strong>Fresh Set Each Time</strong>
              </article>
            </div>
            {!assessmentUnlocked && (
              <div className="assessment-lock-note">
                <strong>Assessment locked.</strong>
                <div>
                  Complete every concept clip, mark every concept note as read, and clear every city in this skill before starting the boss battle.
                </div>
              </div>
            )}
          </div>
        </section>

        {assessmentUnlocked ? (
          <AssessmentWindow
            stateDetails={stateDetails}
            existingResult={existingResult}
            onAssessmentComplete={handleAssessmentComplete}
            integrityFailed={integrityFailed}
            onResetIntegrity={() => setIntegrityFailed(false)}
          />
        ) : (
          <section className="game-window">
            <div className="window-bar">
              <span className="dot green" />
              <span className="dot yellow" />
              <span className="dot blue" />
              <strong>Boss Gate Locked</strong>
            </div>
            <div className="window-body">
              <p className="panel-summary">
                Return to the country window, finish the concept track, and clear the city route first.
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
