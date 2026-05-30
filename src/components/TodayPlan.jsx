import * as React from "react";
import { SESSION_RATINGS } from "../constants";

const { Fragment } = React;

function formatElapsedTime(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getProgressState(progressPercent) {
  if (progressPercent >= 100) return "is-complete";
  if (progressPercent > 0) return "is-active";

  return "is-empty";
}

export default function TodayPlan({
  actualPracticeMinutes,
  canCompleteSession,
  completedSteps,
  elapsedSessionSeconds,
  isSessionRecording = false,
  isSessionTimerRunning,
  onCompleteSession,
  onPauseSessionRecording,
  onResetSessionTimer,
  onResumeSessionRecording,
  onSessionMinutesChange,
  onSessionRatingChange,
  onToggleSessionRecording,
  onToggleSessionTimer,
  onToggleStep,
  plan,
  progressPercent,
  sessionMessage,
  sessionMinutes,
  sessionRating,
}) {
  const progressState = getProgressState(progressPercent);
  const hasStartedSession = elapsedSessionSeconds > 0;
  const sessionActionLabel = hasStartedSession ? "Resume Session" : "Start Session";
  const canRecordSession = typeof onToggleSessionRecording === "function";

  function handleStartOrResumeSession() {
    onToggleSessionTimer();

    if (isSessionRecording && typeof onResumeSessionRecording === "function") {
      onResumeSessionRecording();
    }
  }

  function handlePauseSession() {
    onToggleSessionTimer();

    if (isSessionRecording && typeof onPauseSessionRecording === "function") {
      onPauseSessionRecording();
    }
  }

  function handleStopSession() {
    onResetSessionTimer();
  }

  function handleToggleSessionRecording() {
    if (!canRecordSession) return;

    onToggleSessionRecording();
  }

  return (
    <Fragment>
      <section className="session-card">
        <div className="session-header">
          <div>
            <p className="eyebrow">Session</p>
            <h2>Today’s Plan</h2>
          </div>
          <div className={`progress-badge ${progressState}`}>{progressPercent}%</div>
        </div>

        <div className="session-length-card">
          <div>
            <strong>Practice Length</strong>
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
          <div className={`progress-fill ${progressState}`} style={{ width: `${progressPercent}%` }} />
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
            <h3>Practice Session</h3>
            <p>Start your timer, pause or resume as needed, and stop to reset. After practicing, rate the session before saving it to your history.</p>
          </div>

          <div className="session-timer-display">
            <span>Elapsed</span>
            <strong>{formatElapsedTime(elapsedSessionSeconds)}</strong>
            <small>
              Planned: {sessionMinutes} min • Actual saved: {actualPracticeMinutes} min
            </small>
          </div>

          <div className="session-timer-actions">
            {isSessionTimerRunning ? (
              <div className="session-running-actions" aria-label="Active session controls">
                <button type="button" className="session-icon-button session-pause-button" title="Pause Session" aria-label="Pause Session" onClick={handlePauseSession}>
                  <PauseIcon />
                </button>

                <button
                  type="button"
                  className={`session-icon-button session-record-button ${isSessionRecording ? "is-recording" : ""}`}
                  title={canRecordSession ? (isSessionRecording ? "Stop Recording" : "Record Session") : "Recording coming next"}
                  aria-label={canRecordSession ? (isSessionRecording ? "Stop Recording" : "Record Session") : "Recording coming next"}
                  onClick={handleToggleSessionRecording}
                  disabled={!canRecordSession}
                >
                  <RecordIcon />
                </button>

                <button type="button" className="session-icon-button session-stop-button" title="Stop and Reset Session" aria-label="Stop and Reset Session" onClick={handleStopSession}>
                  <StopIcon />
                </button>
              </div>
            ) : (
              <button type="button" className="selected-button session-primary-action" onClick={handleStartOrResumeSession}>
                {sessionActionLabel}
              </button>
            )}
          </div>

          <div className="session-rating-block">
            <p className={`session-rating-label ${hasStartedSession ? "" : "is-muted"}`}>Rate this session</p>

            <div className="rating-row" aria-label="Rate this session">
              {SESSION_RATINGS.map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => onSessionRatingChange(rating)}
                  className={sessionRating === rating ? "selected-button" : "ghost-button"}
                  disabled={!hasStartedSession}
                >
                  {rating}
                </button>
              ))}
            </div>
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

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8 5.5v13" />
      <path d="M16 5.5v13" />
    </svg>
  );
}

function RecordIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="5.25" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7.5 7.5h9v9h-9z" />
    </svg>
  );
}
