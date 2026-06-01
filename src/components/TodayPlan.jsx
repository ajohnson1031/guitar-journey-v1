import * as React from "react";
import { SESSION_RATINGS } from "../constants";
import { getLevelBarStates, getLevelMeterTone } from "../utils/microphoneTestUtils";
import { getPracticeHistoryStats, getTodayPracticeSummary } from "../utils/practiceStatsUtils";
import { formatRecordingDuration } from "../utils/recordingStorageUtils";
import { CheckIcon, MicIcon, PauseIcon, PlayIcon, RecordIcon, StopIcon } from "./AppIcons";
import ConfirmDialog from "./ConfirmDialog";

const { Fragment, useEffect, useMemo, useRef, useState } = React;

const SESSION_RECORDING_LEVEL_BAR_COUNT = 6;

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
  hasPendingRecording = false,
  isSessionRecording = false,
  isSessionRecordingPaused = false,
  isSessionTimerRunning,
  onCompleteSession,
  onPauseSessionRecording,
  onResetSessionTimer,
  onResumeSessionRecording,
  onSessionMinutesChange,
  onSessionNotesChange = () => {},
  onSessionRatingChange,
  onToggleSessionRecording,
  onToggleSessionTimer,
  onToggleStep,
  plan,
  progressPercent,
  recordingDurationSeconds = 0,
  recordingInputLevel = 0,
  recordingMessage = "",
  sessionHistory = [],
  sessionMessage,
  sessionMinutes,
  sessionNotes = "",
  sessionRating,
}) {
  const [expandedStepLabel, setExpandedStepLabel] = useState(() => plan[0]?.label || "");
  const [isStopDialogOpen, setIsStopDialogOpen] = useState(false);
  const didPauseSessionForStopRef = useRef(false);
  const didPauseRecordingForStopRef = useRef(false);

  const progressState = getProgressState(progressPercent);
  const hasStartedSession = elapsedSessionSeconds > 0;
  const isSessionActive = hasStartedSession || isSessionTimerRunning || isSessionRecording;
  const sessionActionLabel = hasStartedSession ? "Resume Session" : "Start Session";
  const canRecordSession = typeof onToggleSessionRecording === "function";
  const shouldShowRecordingStatus = Boolean(recordingMessage || isSessionRecording || hasPendingRecording);
  const todaySummary = useMemo(() => getTodayPracticeSummary(sessionHistory), [sessionHistory]);
  const practiceStats = useMemo(() => getPracticeHistoryStats(sessionHistory), [sessionHistory]);

  useEffect(() => {
    setExpandedStepLabel((currentStepLabel) => {
      const hasCurrentStep = plan.some((step) => step.label === currentStepLabel);

      return hasCurrentStep ? currentStepLabel : plan[0]?.label || "";
    });
  }, [plan]);

  function resetStopDecisionState() {
    didPauseSessionForStopRef.current = false;
    didPauseRecordingForStopRef.current = false;
  }

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

  async function handleRequestStopSession() {
    if (isSessionTimerRunning) {
      onToggleSessionTimer();
      didPauseSessionForStopRef.current = true;
    }

    if (isSessionRecording && !isSessionRecordingPaused && typeof onPauseSessionRecording === "function") {
      didPauseRecordingForStopRef.current = true;
      await onPauseSessionRecording();
    }

    setIsStopDialogOpen(true);
  }

  async function handleCancelStopSession() {
    setIsStopDialogOpen(false);

    if (didPauseSessionForStopRef.current) {
      onToggleSessionTimer();
    }

    if (didPauseRecordingForStopRef.current && typeof onResumeSessionRecording === "function") {
      await onResumeSessionRecording();
    }

    resetStopDecisionState();
  }

  async function handleConfirmStopSession() {
    setIsStopDialogOpen(false);
    resetStopDecisionState();
    await onResetSessionTimer();
  }

  function handleToggleSessionRecording() {
    if (!canRecordSession) return;

    onToggleSessionRecording();
  }

  function handleExpandStep(stepLabel) {
    setExpandedStepLabel(stepLabel);
  }

  function handleStepKeyDown(event, stepLabel) {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    handleExpandStep(stepLabel);
  }

  function handleToggleStepComplete(event, stepLabel) {
    event.stopPropagation();
    onToggleStep(stepLabel);
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

        <PracticeSummaryCard practiceStats={practiceStats} todaySummary={todaySummary} />

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

        <div className="step-list" aria-label="Today’s practice steps">
          {plan.map((step) => {
            const isComplete = Boolean(completedSteps[step.label]);
            const isExpanded = expandedStepLabel === step.label;

            return (
              <article
                key={step.label}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                aria-label={`${step.label} practice step`}
                onClick={() => handleExpandStep(step.label)}
                onKeyDown={(event) => handleStepKeyDown(event, step.label)}
                className={`step-card ${isComplete ? "is-complete" : ""} ${isExpanded ? "is-expanded" : ""}`}
              >
                <div className="step-card-header">
                  <span className="step-card-title-row">
                    <strong>{step.label}</strong>
                    <small>{step.minutes} min</small>
                  </span>

                  <button
                    type="button"
                    className={`step-complete-button ${isComplete ? "is-complete" : ""}`}
                    aria-label={`Mark ${step.label} ${isComplete ? "incomplete" : "complete"}`}
                    title={isComplete ? "Mark incomplete" : "Mark complete"}
                    onClick={(event) => handleToggleStepComplete(event, step.label)}
                  >
                    <CheckIcon />
                  </button>
                </div>

                <p className="step-card-detail">{step.detail}</p>
              </article>
            );
          })}
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
                  title={isSessionRecording ? "Stop Recording" : "Record Session"}
                  aria-label={isSessionRecording ? "Stop Recording" : "Record Session"}
                  onClick={handleToggleSessionRecording}
                  disabled={!canRecordSession}
                >
                  <RecordIcon />
                </button>

                <button
                  type="button"
                  className="session-icon-button session-stop-button"
                  title="Stop and Discard Session"
                  aria-label="Stop and Discard Session"
                  onClick={handleRequestStopSession}
                >
                  <StopIcon />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="selected-button session-primary-action"
                title={sessionActionLabel}
                aria-label={sessionActionLabel}
                onClick={handleStartOrResumeSession}
              >
                <PlayIcon />
                <span>{sessionActionLabel}</span>
              </button>
            )}
          </div>

          {shouldShowRecordingStatus ? (
            <p className={`session-recording-status ${isSessionRecording ? "is-recording" : ""} ${hasPendingRecording ? "is-ready" : ""}`}>
              {isSessionRecording
                ? `${isSessionRecordingPaused ? "Recording paused" : "Recording"} • ${formatRecordingDuration(recordingDurationSeconds)}`
                : recordingMessage || "Recording ready to save with this session."}
            </p>
          ) : null}

          {isSessionActive ? <SessionRecordingLevelMeter isRecording={isSessionRecording} level={recordingInputLevel} /> : null}

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

          {hasStartedSession ? (
            <label className="session-notes-block" htmlFor="session-notes">
              <span>Session Notes</span>
              <textarea
                id="session-notes"
                value={sessionNotes}
                onChange={(event) => onSessionNotesChange(event.target.value)}
                placeholder="What went well? What needs work?"
                rows={4}
              />
            </label>
          ) : null}

          <button type="button" className="complete-session-button" onClick={onCompleteSession} disabled={!canCompleteSession}>
            Save Completed Session
          </button>

          {sessionMessage ? <p className="session-message">{sessionMessage}</p> : null}
        </div>
      </section>

      <ConfirmDialog
        isOpen={isStopDialogOpen}
        title="Discard this session?"
        message="Stopping will reset the timer and discard any unsaved recording for this session. Cancel to keep practicing."
        confirmLabel="Discard Session"
        cancelLabel="Cancel"
        tone="danger"
        onCancel={handleCancelStopSession}
        onConfirm={handleConfirmStopSession}
      />
    </Fragment>
  );
}

function PracticeSummaryCard({ practiceStats, todaySummary }) {
  const sessionLabel = todaySummary.sessionCount === 1 ? "session" : "sessions";
  const streakLabel = practiceStats.currentStreak === 1 ? "day" : "days";

  return (
    <div className="practice-summary-card">
      <div>
        <p className="eyebrow">Today’s Practice</p>
        <h3>{todaySummary.hasPracticedToday ? `${todaySummary.sessionCount} saved ${sessionLabel}` : "No saved sessions today"}</h3>
        <p>
          {todaySummary.hasPracticedToday
            ? `You’ve logged ${todaySummary.practiceLabel} today. Keep the streak alive with one focused session.`
            : "Start and save a session today to build momentum."}
        </p>
      </div>

      <div className="practice-summary-grid">
        <PracticeSummaryStat label="Today" value={todaySummary.practiceLabel} />
        <PracticeSummaryStat label="This week" value={practiceStats.thisWeekPracticeLabel} />
        <PracticeSummaryStat label="Streak" value={`${practiceStats.currentStreak} ${streakLabel}`} />
      </div>
    </div>
  );
}

function PracticeSummaryStat({ label, value }) {
  return (
    <div className="practice-summary-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SessionRecordingLevelMeter({ isRecording, level }) {
  const levelBars = getLevelBarStates(level, SESSION_RECORDING_LEVEL_BAR_COUNT);
  const tone = getLevelMeterTone(level, SESSION_RECORDING_LEVEL_BAR_COUNT);
  const statusLabel = isRecording ? "Recording" : "Monitoring";

  return (
    <div className="session-recording-level-card">
      <div className="session-recording-level-header">
        <span className="session-recording-level-icon" aria-label="Live input">
          <MicIcon />
        </span>
        <small>{statusLabel}</small>
      </div>

      <div className={`session-recording-mini-meter is-level-${tone}`} aria-label="Session recording input level" aria-live="polite">
        {levelBars.map((isLevelActive, index) => (
          <span key={index} className={`session-recording-mini-bar ${isLevelActive ? "is-level-active" : ""}`} />
        ))}
      </div>
    </div>
  );
}
