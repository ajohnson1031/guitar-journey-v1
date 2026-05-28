import * as React from "react";
import { createWeeklyPracticePlan } from "../utils/weeklyPlanUtils";

const { useMemo } = React;

export default function WeeklyPlan({ masteredSongs, selectedSong, sessionHistory, sessionMinutes, transitionScores }) {
  const weeklyPlan = useMemo(() => {
    return createWeeklyPracticePlan({
      masteredSongs,
      selectedSong,
      sessionHistory,
      sessionMinutes,
      transitionScores,
    });
  }, [masteredSongs, selectedSong, sessionHistory, sessionMinutes, transitionScores]);

  return (
    <section className="panel-card detail-section-card weekly-plan-card">
      <div className="detail-section-header weekly-plan-header">
        <div>
          <p className="eyebrow">Weekly Roadmap</p>
          <h2>This Week’s Focus</h2>
          <p className="section-copy">A seven-day practice path built around your current song, session length, transition scores, and recent practice history.</p>
        </div>
      </div>

      <div className="weekly-focus-card">
        <div>
          <span>Current focus</span>
          <strong>{weeklyPlan.focusTitle}</strong>
          <p>{weeklyPlan.focusSubtitle}</p>
        </div>
      </div>

      <div className="weekly-summary-grid">
        <div>
          <span>{weeklyPlan.days.length}</span>
          <small>practice days</small>
        </div>

        <div>
          <span>{sessionMinutes}</span>
          <small>minutes per day</small>
        </div>

        <div>
          <span>{weeklyPlan.recentSessionCount}</span>
          <small>recent song sessions</small>
        </div>

        <div>
          <span>{weeklyPlan.totalRecentMinutes}</span>
          <small>recent minutes</small>
        </div>
      </div>

      <div className="weekly-day-list">
        {weeklyPlan.days.map((day) => (
          <article key={day.day} className="weekly-day-card">
            <div className="weekly-day-badge">{day.day}</div>

            <div>
              <div className="weekly-day-title-row">
                <h3>{day.title}</h3>
                <span>{day.minutes} min</span>
              </div>

              <p>{day.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
