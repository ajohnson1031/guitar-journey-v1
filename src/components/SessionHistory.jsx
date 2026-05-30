import * as React from "react";
import { formatPracticeDate, formatSessionActualDuration, getPracticeHistoryStats } from "../utils/practiceStatsUtils";

const { Fragment } = React;

export default function SessionHistory({ sessions }) {
  const stats = getPracticeHistoryStats(sessions);
  const recentSessions = sessions.slice(0, 8);

  return (
    <Fragment>
      <section className="panel-card session-history-card">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Practice History</p>
            <h2>Your practice summary</h2>
            <p className="section-copy">Completed sessions are saved locally on this device.</p>
          </div>
        </div>

        <div className="history-summary-grid">
          <HistorySummaryCard value={stats.currentStreak} label="current streak" helper="days" accent={stats.currentStreak > 0 ? "green" : "muted"} />
          <HistorySummaryCard value={stats.longestStreak} label="longest streak" helper="days" />
          <HistorySummaryCard value={stats.thisWeekPracticeLabel} label="this week" helper="practice time" />
          <HistorySummaryCard value={stats.averageRating} label="average feel" helper="saved rating" />
        </div>

        <div className="history-streak-card">
          <div>
            <p className="eyebrow">Momentum</p>
            <h3>{stats.currentStreak > 0 ? `${stats.currentStreak}-day streak` : "No active streak yet"}</h3>
            <p>{stats.currentStreak > 0 ? "Keep it going with one completed session today." : "Complete a session today to start a new streak."}</p>
          </div>

          <div className="history-streak-meta">
            <span>Total practice</span>
            <strong>{stats.totalPracticeLabel}</strong>
            <small>Last practiced: {stats.lastPracticedLabel}</small>
          </div>
        </div>

        {recentSessions.length ? (
          <div className="history-list">
            {recentSessions.map((session) => (
              <article key={session.id} className="history-card">
                <div className="history-card-header">
                  <div>
                    <strong>{session.songTitle}</strong>
                    {session.genre ? <small>{session.genre}</small> : null}
                  </div>

                  <span>{formatPracticeDate(session.completedAt)}</span>
                </div>

                <div className="history-card-metrics">
                  <span>{formatSessionActualDuration(session.elapsedSeconds, session.minutes)} actual</span>

                  {session.plannedMinutes ? <span>{session.plannedMinutes} min planned</span> : null}

                  <span>
                    {session.completedStepCount}/{session.totalStepCount} steps
                  </span>

                  <span>{session.rating}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="history-empty">
            <h3>No completed sessions yet</h3>
            <p>Finish today’s plan to start building streaks, weekly totals, and a real practice log.</p>
          </div>
        )}
      </section>
    </Fragment>
  );
}

function HistorySummaryCard({ accent = "blue", helper, label, value }) {
  return (
    <article className={`history-summary-card history-summary-card--${accent}`}>
      <strong>{value}</strong>
      <span>{label}</span>
      <small>{helper}</small>
    </article>
  );
}
