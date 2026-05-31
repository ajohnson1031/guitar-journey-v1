import * as React from "react";

const { Fragment } = React;

function getTotalPracticeMinutes(sessionHistory = []) {
  return (Array.isArray(sessionHistory) ? sessionHistory : []).reduce((total, session) => total + (Number(session?.minutes) || 0), 0);
}

export default function LocalProgressCard({
  masteredCount = 0,
  onResetLocalProgress = () => {},
  sessionHistory = [],
  totalPracticeMinutes,
  transitionScores = {},
}) {
  const actualPracticeMinutes = Number.isFinite(Number(totalPracticeMinutes)) ? Number(totalPracticeMinutes) : getTotalPracticeMinutes(sessionHistory);
  const trackedTransitionCount = Object.keys(transitionScores || {}).length;

  return (
    <Fragment>
      <section className="panel-card local-progress-card">
        <h2>Local Progress</h2>
        <div className="progress-stat-grid">
          <div>
            <span>{masteredCount}</span>
            <small>songs mastered</small>
          </div>
          <div>
            <span>{trackedTransitionCount}</span>
            <small>tracked transitions</small>
          </div>
          <div>
            <span>{sessionHistory.length}</span>
            <small>sessions completed</small>
          </div>
          <div>
            <span>{actualPracticeMinutes}</span>
            <small>actual minutes</small>
          </div>
        </div>

        <button type="button" className="danger-button" onClick={onResetLocalProgress}>
          Reset Local Progress
        </button>
      </section>
    </Fragment>
  );
}
