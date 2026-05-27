import * as React from "react";

const { Fragment } = React;

function formatSessionDate(value) {
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "Unknown date";
  }
}

function formatDuration(totalSeconds, fallbackMinutes) {
  if (!totalSeconds) {
    return `${fallbackMinutes} min`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) {
    return `${seconds}s`;
  }

  if (seconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes}m ${seconds}s`;
}

export default function SessionHistory({ sessions }) {
  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((sum, session) => sum + session.minutes, 0);
  const recentSessions = sessions.slice(0, 5);

  return (
    <Fragment>
      <section className="panel-card session-history-card">
        <div className="section-heading-row">
          <div>
            <h2>Practice History</h2>
            <p className="section-copy">Completed sessions are saved locally on this device.</p>
          </div>
        </div>

        <div className="history-stat-grid">
          <div>
            <span>{totalSessions}</span>
            <small>sessions</small>
          </div>
          <div>
            <span>{totalMinutes}</span>
            <small>actual minutes</small>
          </div>
        </div>

        {recentSessions.length ? (
          <div className="history-list">
            {recentSessions.map((session) => (
              <article key={session.id} className="history-card">
                <div>
                  <strong>{session.songTitle}</strong>
                  <span>{formatSessionDate(session.completedAt)}</span>
                </div>

                <p>
                  {formatDuration(session.elapsedSeconds, session.minutes)} actual
                  {session.plannedMinutes ? ` • ${session.plannedMinutes} min planned` : ""} • {session.completedStepCount}/{session.totalStepCount} steps • {session.rating}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="history-empty">
            <p>No completed sessions yet. Finish today’s plan to start building history.</p>
          </div>
        )}
      </section>
    </Fragment>
  );
}
