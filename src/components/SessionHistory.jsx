import * as React from "react";
import { useRecordingPlayback } from "../hooks";
import { formatPracticeDate, formatSessionActualDuration, getPracticeHistoryStats } from "../utils/practiceStatsUtils";
import { formatRecordingDuration } from "../utils/recordingStorageUtils";
import { PauseIcon, PlayIcon, ReplayIcon, StopIcon, TrashIcon } from "./AppIcons";
import ConfirmDialog from "./ConfirmDialog";

const { Fragment, useEffect, useState } = React;

function formatPracticeTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown time";

  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getRecordingActionLabel({ isLoading, isPaused, isPlaying, isReplay }) {
  if (isLoading) return "Loading...";
  if (isPlaying) return "Pause Recording";
  if (isPaused) return "Paused - Resume Playback";
  if (isReplay) return "Replay Recording";

  return "Play Recording";
}

function canStopRecordingPlayback({ isActiveRecording, playbackState }) {
  return isActiveRecording && ["loading", "playing", "paused"].includes(playbackState);
}

export default function SessionHistory({ onDeleteSessionRecording, sessions }) {
  const [historyActionMessage, setHistoryActionMessage] = useState("");
  const [pendingDeleteSession, setPendingDeleteSession] = useState(null);

  const stats = getPracticeHistoryStats(sessions);
  const recentSessions = sessions.slice(0, 8);

  const { activeRecordingId, isLoadingRecording, isPlayingRecording, playbackMessage, playbackMessageRecordingId, playbackState, playRecording, stopPlayback } =
    useRecordingPlayback();

  useEffect(() => {
    if (!historyActionMessage) return undefined;

    const timeoutId = window.setTimeout(() => {
      setHistoryActionMessage("");
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [historyActionMessage]);

  function handleRequestDeleteRecording(session) {
    setHistoryActionMessage("");
    setPendingDeleteSession(session);
  }

  function handleCancelDeleteRecording() {
    setPendingDeleteSession(null);
  }

  async function handleConfirmDeleteRecording() {
    const session = pendingDeleteSession;

    setPendingDeleteSession(null);

    if (!session?.recordingId || !onDeleteSessionRecording) return;

    try {
      stopPlayback(session.recordingId);

      const didDelete = await onDeleteSessionRecording(session);

      setHistoryActionMessage(didDelete ? "Recording deleted. Session history kept." : "Recording could not be deleted.");
    } catch {
      setHistoryActionMessage("Recording could not be deleted.");
    }
  }

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

        {historyActionMessage ? <p className="history-action-message">{historyActionMessage}</p> : null}

        {recentSessions.length ? (
          <div className="history-list">
            {recentSessions.map((session) => {
              const isActiveRecording = activeRecordingId === session.recordingId;
              const isLoadingThisRecording = isActiveRecording && isLoadingRecording;
              const isPlayingThisRecording = isActiveRecording && isPlayingRecording;
              const isPausedThisRecording = isActiveRecording && playbackState === "paused";
              const isReplayThisRecording = isActiveRecording && playbackState === "finished";
              const canStopThisRecording = canStopRecordingPlayback({ isActiveRecording, playbackState });
              const hasPlaybackMessage = playbackMessageRecordingId === session.recordingId && playbackMessage;
              const recordingActionLabel = getRecordingActionLabel({
                isLoading: isLoadingThisRecording,
                isPaused: isPausedThisRecording,
                isPlaying: isPlayingThisRecording,
                isReplay: isReplayThisRecording,
              });

              return (
                <article key={session.id} className="history-card">
                  <div className="history-card-header">
                    <div>
                      <strong>{session.songTitle}</strong>
                      {session.genre ? <small>{session.genre}</small> : null}
                    </div>

                    <div className="history-card-date">
                      <span>{formatPracticeDate(session.completedAt)}</span>
                      <small>{formatPracticeTime(session.completedAt)}</small>
                    </div>
                  </div>

                  <div className="history-card-footer">
                    <div className="history-card-metrics">
                      <span>{formatSessionActualDuration(session.elapsedSeconds, session.minutes)} actual</span>

                      {session.plannedMinutes ? <span>{session.plannedMinutes} min planned</span> : null}

                      <span>
                        {session.completedStepCount}/{session.totalStepCount} steps
                      </span>

                      <span>{session.rating}</span>

                      {session.recordingId ? <span>Recording {formatRecordingDuration(session.recordingDurationSeconds)}</span> : null}
                    </div>

                    {session.recordingId ? (
                      <div className="history-recording-actions">
                        <div className="history-recording-controls">
                          <button
                            type="button"
                            className={`history-recording-button ${isPlayingThisRecording ? "is-playing" : ""} ${isReplayThisRecording ? "is-replay" : ""}`}
                            onClick={() => playRecording(session)}
                            disabled={isLoadingThisRecording}
                          >
                            {isPlayingThisRecording ? <PauseIcon /> : isReplayThisRecording ? <ReplayIcon className="history-replay-icon" /> : <PlayIcon />}
                            <span>{recordingActionLabel}</span>
                          </button>

                          <button
                            type="button"
                            className="history-recording-stop-button"
                            title="Stop playback"
                            aria-label="Stop playback"
                            onClick={() => stopPlayback(session.recordingId)}
                            disabled={!canStopThisRecording}
                          >
                            <StopIcon />
                          </button>

                          <button
                            type="button"
                            className="history-recording-delete-button"
                            title="Delete recording"
                            aria-label={`Delete recording for ${session.songTitle}`}
                            onClick={() => handleRequestDeleteRecording(session)}
                          >
                            <TrashIcon />
                          </button>
                        </div>

                        {hasPlaybackMessage ? <p className="history-playback-message">{playbackMessage}</p> : null}
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="history-empty">
            <h3>No completed sessions yet</h3>
            <p>Finish today’s plan to start building streaks, weekly totals, and a real practice log.</p>
          </div>
        )}
      </section>

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteSession)}
        title="Delete this recording?"
        message="This removes the saved audio from this device, but keeps the practice session in your history."
        confirmLabel="Delete Recording"
        cancelLabel="Cancel"
        tone="danger"
        onCancel={handleCancelDeleteRecording}
        onConfirm={handleConfirmDeleteRecording}
      />
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
