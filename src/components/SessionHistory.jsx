import * as React from "react";
import { useRecordingPlayback } from "../hooks";
import { formatPracticeDate, formatSessionActualDuration, getPracticeDayGroups, getPracticeHistoryStats } from "../utils/practiceStatsUtils";
import { downloadRecordingForSession } from "../utils/recordingExportUtils";
import { formatRecordingDuration, getAllRecordings } from "../utils/recordingStorageUtils";
import { DownloadIcon, PauseIcon, PlayIcon, ReplayIcon, StopIcon, TrashIcon } from "./AppIcons";
import ConfirmDialog from "./ConfirmDialog";

const { Fragment, useEffect, useMemo, useState } = React;

const PRACTICE_HISTORY_SORT_OPTIONS = [
  {
    id: "newest",
    label: "Newest first",
  },
  {
    id: "oldest",
    label: "Oldest first",
  },
  {
    id: "shortest",
    label: "Shortest duration",
  },
  {
    id: "longest",
    label: "Longest duration",
  },
];

function formatPracticeTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown time";

  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getSessionTimestamp(session) {
  const timestamp = new Date(session?.completedAt || 0).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getSessionDurationSeconds(session) {
  const elapsedSeconds = Number(session?.elapsedSeconds);

  if (Number.isFinite(elapsedSeconds) && elapsedSeconds > 0) {
    return Math.round(elapsedSeconds);
  }

  const minutes = Number(session?.minutes);

  if (Number.isFinite(minutes) && minutes > 0) {
    return Math.round(minutes * 60);
  }

  return 0;
}

function getRecordingActionLabel({ isLoading, isPaused, isPlaying, isReplay }) {
  if (isLoading) return "Loading...";
  if (isPlaying) return "Pause Playback";
  if (isPaused) return "Paused - Resume Playback";
  if (isReplay) return "Replay Recording";

  return "Play Recording";
}

function canStopRecordingPlayback({ isActiveRecording, playbackState }) {
  return isActiveRecording && ["loading", "playing", "paused"].includes(playbackState);
}

function filterSessionsBySong(sessions = [], historySongFilter = null) {
  const songId = String(historySongFilter?.songId || "").trim();

  if (!songId) return sessions;

  return sessions.filter((session) => session?.songId === songId);
}

function filterPracticeSessions(sessions = [], searchTerm = "") {
  const normalizedSearchTerm = String(searchTerm || "")
    .trim()
    .toLowerCase();

  if (!normalizedSearchTerm) return sessions;

  return sessions.filter((session) => {
    const searchableText = [session?.songTitle, session?.genre, session?.rating, session?.notes].filter(Boolean).join(" ").toLowerCase();

    return searchableText.includes(normalizedSearchTerm);
  });
}

function sortSessionsInGroup(sessions = [], sortMode = "newest") {
  return [...sessions].sort((leftSession, rightSession) => {
    const leftTimestamp = getSessionTimestamp(leftSession);
    const rightTimestamp = getSessionTimestamp(rightSession);
    const leftDuration = getSessionDurationSeconds(leftSession);
    const rightDuration = getSessionDurationSeconds(rightSession);

    if (sortMode === "oldest") {
      return leftTimestamp - rightTimestamp;
    }

    if (sortMode === "shortest") {
      return leftDuration - rightDuration || rightTimestamp - leftTimestamp;
    }

    if (sortMode === "longest") {
      return rightDuration - leftDuration || rightTimestamp - leftTimestamp;
    }

    return rightTimestamp - leftTimestamp;
  });
}

function getVisiblePracticeDayGroups(sessions = [], sortMode = "newest") {
  const practiceGroups = getPracticeDayGroups(sessions);
  const sortedGroups = sortMode === "oldest" ? [...practiceGroups].reverse() : practiceGroups;

  return sortedGroups.map((group) => ({
    ...group,
    sessions: sortSessionsInGroup(group.sessions, sortMode),
  }));
}

function getHistorySongFilterLabel(historySongFilter) {
  return String(historySongFilter?.songTitle || "").trim() || "selected song";
}

export default function SessionHistory({ historySongFilter = null, onClearHistorySongFilter, onDeleteSessionRecording, sessions }) {
  const [availableRecordingIds, setAvailableRecordingIds] = useState(() => new Set());
  const [historyActionMessage, setHistoryActionMessage] = useState("");
  const [historyActionTone, setHistoryActionTone] = useState("success");
  const [pendingDeleteSession, setPendingDeleteSession] = useState(null);
  const [practiceHistorySearchTerm, setPracticeHistorySearchTerm] = useState("");
  const [practiceHistorySortMode, setPracticeHistorySortMode] = useState("newest");

  const stats = getPracticeHistoryStats(sessions);
  const hasActiveSongFilter = Boolean(historySongFilter?.songId);
  const historySongFilterLabel = getHistorySongFilterLabel(historySongFilter);
  const songFilteredSessions = useMemo(() => filterSessionsBySong(sessions, historySongFilter), [historySongFilter, sessions]);
  const activeSongStats = useMemo(() => getPracticeHistoryStats(songFilteredSessions), [songFilteredSessions]);
  const hasSongFilteredSessions = songFilteredSessions.length > 0;
  const filteredSessions = useMemo(() => filterPracticeSessions(songFilteredSessions, practiceHistorySearchTerm), [practiceHistorySearchTerm, songFilteredSessions]);
  const recentSessionGroups = useMemo(() => getVisiblePracticeDayGroups(filteredSessions, practiceHistorySortMode).slice(0, 8), [filteredSessions, practiceHistorySortMode]);
  const visibleSessionCount = filteredSessions.length;
  const shouldScrollHistory = visibleSessionCount > 5;

  const { activeRecordingId, isLoadingRecording, isPlayingRecording, playbackMessage, playbackMessageRecordingId, playbackState, playRecording, stopPlayback } =
    useRecordingPlayback();

  useEffect(() => {
    let isMounted = true;

    async function loadAvailableRecordings() {
      try {
        const recordings = await getAllRecordings();
        const recordingIds = new Set();

        recordings.forEach((recording) => {
          const recordingId = String(recording?.recordingId || "").trim();

          if (recordingId) {
            recordingIds.add(recordingId);
          }
        });

        if (isMounted) {
          setAvailableRecordingIds(recordingIds);
        }
      } catch {
        if (isMounted) {
          setAvailableRecordingIds(new Set());
        }
      }
    }

    void loadAvailableRecordings();

    return () => {
      isMounted = false;
    };
  }, [sessions]);

  useEffect(() => {
    if (!historyActionMessage) return undefined;

    const timeoutId = window.setTimeout(() => {
      setHistoryActionMessage("");
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [historyActionMessage]);

  function showHistoryActionMessage(message, tone = "success") {
    setHistoryActionMessage(message);
    setHistoryActionTone(tone);
  }

  function handlePracticeHistorySearchChange(event) {
    setPracticeHistorySearchTerm(event.target.value);
  }

  function handlePracticeHistorySortChange(event) {
    setPracticeHistorySortMode(event.target.value);
  }

  function handleClearHistorySongFilter() {
    if (onClearHistorySongFilter) {
      onClearHistorySongFilter();
    }
  }

  function handleRequestDeleteRecording(session) {
    setHistoryActionMessage("");
    setPendingDeleteSession(session);
  }

  function handleCancelDeleteRecording() {
    setPendingDeleteSession(null);
  }

  async function handleDownloadRecording(session) {
    try {
      const result = await downloadRecordingForSession(session);

      showHistoryActionMessage(`Recording download started: ${result.filename}`);
    } catch (error) {
      showHistoryActionMessage(error instanceof Error ? error.message : "Recording could not be downloaded.", "danger");
    }
  }

  async function handleConfirmDeleteRecording() {
    const session = pendingDeleteSession;

    setPendingDeleteSession(null);

    if (!session?.recordingId || !onDeleteSessionRecording) return;

    try {
      stopPlayback(session.recordingId);

      const didDelete = await onDeleteSessionRecording(session);

      if (didDelete) {
        setAvailableRecordingIds((currentIds) => {
          const nextIds = new Set(currentIds);

          nextIds.delete(session.recordingId);

          return nextIds;
        });
      }

      showHistoryActionMessage(didDelete ? "Recording deleted. Session history kept." : "Recording could not be deleted.", didDelete ? "success" : "danger");
    } catch {
      showHistoryActionMessage("Recording could not be deleted.", "danger");
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

        {hasActiveSongFilter ? (
          <div className="history-active-song-filter">
            <div className="history-active-song-filter-main">
              <span>Viewing song history</span>
              <strong>{historySongFilterLabel}</strong>
            </div>

            <div className="history-active-song-filter-stats" aria-label={`${historySongFilterLabel} history summary`}>
              <span>
                {activeSongStats.totalSessions} session{activeSongStats.totalSessions === 1 ? "" : "s"}
              </span>
              <span>{activeSongStats.totalPracticeLabel} practiced</span>
              <span>Last: {activeSongStats.lastPracticedLabel}</span>
              <span>Avg: {activeSongStats.averageRating}</span>
            </div>

            <button type="button" className="danger-button history-clear-song-filter-button" onClick={handleClearHistorySongFilter}>
              Clear Filter
            </button>
          </div>
        ) : null}

        {sessions.length ? (
          <div className="history-controls" aria-label="Practice history controls">
            <label className="history-search-field">
              <span>Search sessions</span>
              <input type="search" value={practiceHistorySearchTerm} onChange={handlePracticeHistorySearchChange} placeholder="Search by song, genre, rating, or notes..." />
            </label>

            <label className="history-sort-field">
              <span>Sort sessions</span>
              <select value={practiceHistorySortMode} onChange={handlePracticeHistorySortChange}>
                {PRACTICE_HISTORY_SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {historyActionMessage ? <p className={`history-action-message history-action-message--${historyActionTone}`}>{historyActionMessage}</p> : null}

        {recentSessionGroups.length ? (
          <div className={`history-day-group-list ${shouldScrollHistory ? "is-scrollable" : ""}`}>
            {recentSessionGroups.map((group) => (
              <section key={group.dateKey} className="history-day-group">
                <div className="history-day-header">
                  <div>
                    <strong>{formatPracticeDate(group.date)}</strong>
                    <small>
                      {group.sessionCount} session{group.sessionCount === 1 ? "" : "s"}
                    </small>
                  </div>

                  <span>{group.totalPracticeLabel}</span>
                </div>

                <div className="history-list">
                  {group.sessions.map((session) => {
                    const hasRecordingReference = Boolean(session.recordingId);
                    const hasStoredRecording = hasRecordingReference && availableRecordingIds.has(session.recordingId);
                    const hasRemovedRecording = Boolean(session.recordingRemovedAt);
                    const hasMissingRecording = hasRemovedRecording || (hasRecordingReference && !hasStoredRecording);
                    const isActiveRecording = hasStoredRecording && activeRecordingId === session.recordingId;
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
                            <span>{formatPracticeTime(session.completedAt)}</span>
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

                            {hasStoredRecording ? <span>Recording {formatRecordingDuration(session.recordingDurationSeconds)}</span> : null}
                            {hasMissingRecording ? <span className="history-recording-missing-pill">Recording removed</span> : null}
                          </div>

                          {hasStoredRecording ? (
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
                                  className="history-recording-download-button"
                                  title="Download recording"
                                  aria-label={`Download recording for ${session.songTitle}`}
                                  onClick={() => handleDownloadRecording(session)}
                                >
                                  <DownloadIcon />
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

                        {session.notes ? <p className="history-session-notes">{session.notes}</p> : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : sessions.length ? (
          <div className="history-empty">
            <h3>{hasActiveSongFilter && !hasSongFilteredSessions ? "No sessions for this song yet" : "No sessions match this search"}</h3>
            <p>
              {hasActiveSongFilter && !hasSongFilteredSessions
                ? `No saved sessions for ${historySongFilterLabel} yet.`
                : hasActiveSongFilter
                  ? `No saved sessions match this search for ${historySongFilterLabel}.`
                  : "Try a different search term or clear the session search."}
            </p>
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
