import * as React from "react";
import { SESSION_RATINGS } from "../constants";

const { Fragment } = React;

function formatElapsedTime(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function TodayPlan({
  actualPracticeMinutes,
  canCompleteSession,
  completedSteps,
  elapsedSessionSeconds,
  isSessionTimerRunning,
  onCompleteSession,
  onResetSessionTimer,
  onSessionMinutesChange,
  onSessionRatingChange,
  onToggleSessionTimer,
  onToggleStep,
  plan,
  progressPercent,
  sessionMessage,
  sessionMinutes,
  sessionRating,
}) {
  return (
    <Fragment>
      <section className="session-card">
        <div className="session-header">
          <div>
            <p className="eyebrow">Session</p>
            <h2>Today’s Plan</h2>
          </div>
          <div className="progress-badge">{progressPercent}%</div>
        </div>

        <div className="session-length-card">
          <div>
            <span>Practice Length</span>
            <p>Adjust the session length to update each practice block.</p>
          </div>

          <div className="session-length-actions">
            {[15, 20, 30].map((minutes) => (
              <button key={minutes} type="button" onClick={() => onSessionMinutesChange(minutes)} className={sessionMinutes === minutes ? "selected-button" : "ghost-button"}>
                {minutes}m
              </button>
            ))}
          </div>
        </div>

        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="step-list">
          {plan.map((step) => (
            <button key={step.label} type="button" onClick={() => onToggleStep(step.label)} className={`step-card ${completedSteps[step.label] ? "is-complete" : ""}`}>
              <span>
                <strong>{step.label}</strong>
                <small>{step.minutes} min</small>
              </span>
              <p>{step.detail}</p>
            </button>
          ))}
        </div>

        <div className="complete-session-card">
          <div>
            <h3>Complete Session</h3>
            <p>Start the timer, practice, rate how it felt, then save actual practice time.</p>
          </div>

          <div className="session-timer-display">
            <span>Elapsed</span>
            <strong>{formatElapsedTime(elapsedSessionSeconds)}</strong>
            <small>
              Planned: {sessionMinutes} min • Actual saved: {actualPracticeMinutes} min
            </small>
          </div>

          <div className="session-timer-actions">
            <button type="button" className={isSessionTimerRunning ? "metronome-stop-button" : "selected-button"} onClick={onToggleSessionTimer}>
              {isSessionTimerRunning ? "Pause Session" : "Start Session"}
            </button>

            <button type="button" className="ghost-button" onClick={onResetSessionTimer}>
              Reset Timer
            </button>
          </div>

          <div className="rating-row" aria-label="Session rating">
            {SESSION_RATINGS.map((rating) => (
              <button key={rating} type="button" onClick={() => onSessionRatingChange(rating)} className={sessionRating === rating ? "selected-button" : "ghost-button"}>
                {rating}
              </button>
            ))}
          </div>

          <button type="button" className="complete-session-button" onClick={onCompleteSession} disabled={!canCompleteSession}>
            Save Completed Session
          </button>

          {sessionMessage ? <p className="session-message">{sessionMessage}</p> : null}
        </div>
      </section>
    </Fragment>
  );
}
