import * as React from "react";
import { useRecordingPlayback } from "../hooks";
import { downloadRecordingForSession } from "../utils/recordingExportUtils";
import { deleteRecording, formatRecordingDuration, getAllRecordings } from "../utils/recordingStorageUtils";
import { DownloadIcon, PauseIcon, PlayIcon, ReplayIcon, StopIcon, TrashIcon } from "./AppIcons";
import ConfirmDialog from "./ConfirmDialog";

const { Fragment, useEffect, useMemo, useState } = React;

const RECORDING_STATUS_FILTERS = [
  {
    id: "all",
    label: "All",
  },
  {
    id: "linked",
    label: "Linked",
  },
  {
    id: "orphaned",
    label: "Orphaned",
  },
];

const RECORDING_SORT_OPTIONS = [
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

function formatRecordingDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown date";

  const dateLabel = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
  const timeLabel = new Intl.DateTimeFormat("en", {
    timeStyle: "short",
  }).format(date);

  return `${dateLabel} - ${timeLabel}`;
}

function formatRecordingGroupDate(dateKey) {
  if (!dateKey || dateKey === "unknown-date") return "Unknown date";

  const date = new Date(`${dateKey}T12:00:00`);

  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

function getRecordingDateKey(recording) {
  const date = new Date(recording?.createdAt || recording?.updatedAt || 0);

  if (Number.isNaN(date.getTime())) return "unknown-date";

  return date.toISOString().slice(0, 10);
}

function getRecordingTimestamp(recording) {
  const timestamp = new Date(recording?.createdAt || recording?.updatedAt || 0).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getRecordingDurationSeconds(recording) {
  const durationSeconds = Number(recording?.durationSeconds);

  if (!Number.isFinite(durationSeconds) || durationSeconds < 0) return 0;

  return Math.round(durationSeconds);
}

function formatRecordingCountLabel(count) {
  const safeCount = Math.max(0, Math.round(Number(count) || 0));

  return `${safeCount} recording${safeCount === 1 ? "" : "s"}`;
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

function createSessionLikeRecording(recording, linkedSession) {
  return {
    completedAt: linkedSession?.completedAt || recording.createdAt,
    recordingDurationSeconds: recording.durationSeconds,
    recordingId: recording.recordingId,
    recordingMimeType: recording.mimeType,
    songId: linkedSession?.songId || recording.songId,
    songTitle: linkedSession?.songTitle || recording.songTitle || "Untitled Recording",
  };
}

function getRecordingTitle(recording, linkedSession) {
  return linkedSession?.songTitle || recording.songTitle || "Untitled Recording";
}

function sortRecordingItems(recordingItems = [], sortMode = "newest") {
  return [...recordingItems].sort((leftItem, rightItem) => {
    const leftTimestamp = getRecordingTimestamp(leftItem.recording);
    const rightTimestamp = getRecordingTimestamp(rightItem.recording);
    const leftDuration = getRecordingDurationSeconds(leftItem.recording);
    const rightDuration = getRecordingDurationSeconds(rightItem.recording);

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

function filterRecordingItems(recordingItems = [], { searchTerm = "", statusFilter = "all" } = {}) {
  const normalizedSearchTerm = String(searchTerm || "").trim().toLowerCase();

  return recordingItems.filter((item) => {
    if (statusFilter === "linked" && !item.isLinked) return false;
    if (statusFilter === "orphaned" && item.isLinked) return false;

    if (!normalizedSearchTerm) return true;

    const searchableText = [item.title, item.recording?.songTitle, item.recording?.songId, item.recording?.mimeType]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearchTerm);
  });
}

function createRecordingGroups(recordingItems = [], sortMode = "newest") {
  const groupByDateKey = new Map();

  recordingItems.forEach((item) => {
    const dateKey = getRecordingDateKey(item.recording);

    if (!groupByDateKey.has(dateKey)) {
      groupByDateKey.set(dateKey, {
        dateKey,
        items: [],
        totalDurationSeconds: 0,
      });
    }

    const group = groupByDateKey.get(dateKey);

    group.items.push(item);
    group.totalDurationSeconds += getRecordingDurationSeconds(item.recording);
  });

  return Array.from(groupByDateKey.values()).sort((leftGroup, rightGroup) => {
    if (leftGroup.dateKey === "unknown-date") return 1;
    if (rightGroup.dateKey === "unknown-date") return -1;

    if (sortMode === "oldest") {
      return leftGroup.dateKey.localeCompare(rightGroup.dateKey);
    }

    return rightGroup.dateKey.localeCompare(leftGroup.dateKey);
  });
}

export default function RecordingsLibrary({ sessions = [] }) {
  const [actionMessage, setActionMessage] = useState("");
  const [actionTone, setActionTone] = useState("success");
  const [isLoadingRecordings, setIsLoadingRecordings] = useState(true);
  const [pendingDeleteRecording, setPendingDeleteRecording] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [recordingSearchTerm, setRecordingSearchTerm] = useState("");
  const [recordingSortMode, setRecordingSortMode] = useState("newest");
  const [recordingStatusFilter, setRecordingStatusFilter] = useState("all");

  const { activeRecordingId, isLoadingRecording, isPlayingRecording, playbackMessage, playbackMessageRecordingId, playbackState, playRecording, stopPlayback } =
    useRecordingPlayback();

  const sessionByRecordingId = useMemo(() => {
    const nextSessionByRecordingId = new Map();

    sessions.forEach((session) => {
      const recordingId = String(session?.recordingId || "").trim();

      if (recordingId) {
        nextSessionByRecordingId.set(recordingId, session);
      }
    });

    return nextSessionByRecordingId;
  }, [sessions]);

  const allRecordingItems = useMemo(() => {
    return recordings
      .map((recording) => {
        const recordingId = String(recording?.recordingId || "").trim();
        const linkedSession = sessionByRecordingId.get(recordingId) || null;

        return {
          isLinked: Boolean(linkedSession),
          linkedSession,
          recording,
          recordingId,
          title: getRecordingTitle(recording, linkedSession),
        };
      })
      .filter((item) => item.recordingId);
  }, [recordings, sessionByRecordingId]);

  const recordingItems = useMemo(() => {
    const filteredItems = filterRecordingItems(allRecordingItems, {
      searchTerm: recordingSearchTerm,
      statusFilter: recordingStatusFilter,
    });

    return sortRecordingItems(filteredItems, recordingSortMode);
  }, [allRecordingItems, recordingSearchTerm, recordingSortMode, recordingStatusFilter]);

  const recordingGroups = useMemo(() => createRecordingGroups(recordingItems, recordingSortMode), [recordingItems, recordingSortMode]);

  const linkedRecordingCount = allRecordingItems.filter((item) => item.isLinked).length;
  const orphanedRecordingCount = allRecordingItems.length - linkedRecordingCount;
  const hasAnyRecordings = allRecordingItems.length > 0;
  const hasFilteredRecordings = recordingItems.length > 0;
  const shouldScrollRecordings = recordingItems.length > 5;

  useEffect(() => {
    let isMounted = true;

    async function loadRecordings() {
      setIsLoadingRecordings(true);

      try {
        const savedRecordings = await getAllRecordings();

        if (isMounted) {
          setRecordings(Array.isArray(savedRecordings) ? savedRecordings : []);
        }
      } catch {
        if (isMounted) {
          setRecordings([]);
          showActionMessage("Recordings could not be loaded from this browser.", "danger");
        }
      } finally {
        if (isMounted) {
          setIsLoadingRecordings(false);
        }
      }
    }

    void loadRecordings();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!actionMessage) return undefined;

    const timeoutId = window.setTimeout(() => {
      setActionMessage("");
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [actionMessage]);

  function showActionMessage(message, tone = "success") {
    setActionMessage(message);
    setActionTone(tone);
  }

  function handleRecordingSearchChange(event) {
    setRecordingSearchTerm(event.target.value);
  }

  function handleRecordingSortChange(event) {
    setRecordingSortMode(event.target.value);
  }

  async function handleDownloadRecording(item) {
    try {
      const result = await downloadRecordingForSession(createSessionLikeRecording(item.recording, item.linkedSession));

      showActionMessage(`Recording download started: ${result.filename}`);
    } catch (error) {
      showActionMessage(error instanceof Error ? error.message : "Recording could not be downloaded.", "danger");
    }
  }

  function handleRequestDeleteRecording(item) {
    setActionMessage("");
    setPendingDeleteRecording(item);
  }

  function handleCancelDeleteRecording() {
    setPendingDeleteRecording(null);
  }

  async function handleConfirmDeleteRecording() {
    const item = pendingDeleteRecording;

    setPendingDeleteRecording(null);

    if (!item?.recordingId) return;

    try {
      stopPlayback(item.recordingId);

      await deleteRecording(item.recordingId);

      setRecordings((currentRecordings) => currentRecordings.filter((recording) => recording.recordingId !== item.recordingId));
      showActionMessage(item.isLinked ? "Recording deleted. Session history kept." : "Orphaned recording deleted.");
    } catch {
      showActionMessage("Recording could not be deleted.", "danger");
    }
  }

  function renderRecordingCard(item) {
    const { isLinked, linkedSession, recording, recordingId, title } = item;
    const isActiveRecording = activeRecordingId === recordingId;
    const isLoadingThisRecording = isActiveRecording && isLoadingRecording;
    const isPlayingThisRecording = isActiveRecording && isPlayingRecording;
    const isPausedThisRecording = isActiveRecording && playbackState === "paused";
    const isReplayThisRecording = isActiveRecording && playbackState === "finished";
    const canStopThisRecording = canStopRecordingPlayback({ isActiveRecording, playbackState });
    const hasPlaybackMessage = playbackMessageRecordingId === recordingId && playbackMessage;
    const recordingActionLabel = getRecordingActionLabel({
      isLoading: isLoadingThisRecording,
      isPaused: isPausedThisRecording,
      isPlaying: isPlayingThisRecording,
      isReplay: isReplayThisRecording,
    });
    const sessionLikeRecording = createSessionLikeRecording(recording, linkedSession);

    return (
      <article key={recordingId} className="recording-library-card">
        <div className="recording-library-card-header">
          <div>
            <strong>{title}</strong>
            <small>{formatRecordingDateTime(recording.createdAt || recording.updatedAt)}</small>
          </div>

          <span className={`recording-status-pill ${isLinked ? "recording-status-pill--linked" : "recording-status-pill--orphaned"}`}>
            {isLinked ? "Linked" : "Orphaned"}
          </span>
        </div>

        <div className="recording-library-meta">
          <span>{formatRecordingDuration(recording.durationSeconds)} duration</span>
          {recording.mimeType ? <span>{recording.mimeType}</span> : null}
          {recording.songId ? <span>{recording.songId}</span> : null}
        </div>

        <div className="recording-library-actions">
          <button
            type="button"
            className={`recording-playback-button ${isPlayingThisRecording ? "is-playing" : ""} ${isReplayThisRecording ? "is-replay" : ""}`}
            onClick={() => playRecording(sessionLikeRecording)}
            disabled={isLoadingThisRecording}
          >
            {isPlayingThisRecording ? <PauseIcon /> : isReplayThisRecording ? <ReplayIcon className="recording-replay-icon" /> : <PlayIcon />}
            <span>{recordingActionLabel}</span>
          </button>

          <button
            type="button"
            className="recording-stop-button"
            title="Stop playback"
            aria-label={`Stop playback for ${title}`}
            onClick={() => stopPlayback(recordingId)}
            disabled={!canStopThisRecording}
          >
            <StopIcon />
          </button>

          <button
            type="button"
            className="recording-download-button"
            title="Download recording"
            aria-label={`Download recording for ${title}`}
            onClick={() => handleDownloadRecording(item)}
          >
            <DownloadIcon />
          </button>

          <button
            type="button"
            className="recording-delete-button"
            title="Delete recording"
            aria-label={`Delete recording for ${title}`}
            onClick={() => handleRequestDeleteRecording(item)}
          >
            <TrashIcon />
          </button>
        </div>

        {hasPlaybackMessage ? <p className="recording-playback-message">{playbackMessage}</p> : null}
      </article>
    );
  }

  return (
    <Fragment>
      <section className="panel-card recordings-library-card">
        <div className="recordings-library-hero">
          <div>
            <p className="eyebrow">Recordings</p>
            <h2>Recording library</h2>
            <p>Review, play, download, and clean up local practice recordings stored on this device.</p>
          </div>
        </div>

        <div className="recordings-library-summary-grid">
          <SummaryCard label="stored" value={allRecordingItems.length} helper="local recordings" />
          <SummaryCard label="linked" value={linkedRecordingCount} helper="matched to sessions" accent="green" />
          <SummaryCard label="orphaned" value={orphanedRecordingCount} helper="not tied to history" accent={orphanedRecordingCount > 0 ? "danger" : "muted"} />
        </div>

        {hasAnyRecordings ? (
          <div className="recordings-library-controls" aria-label="Recording library controls">
            <label className="recordings-search-field">
              <span>Search recordings</span>
              <input type="search" value={recordingSearchTerm} onChange={handleRecordingSearchChange} placeholder="Search by song or recording..." />
            </label>

            <div className="recordings-filter-group" role="group" aria-label="Recording status filter">
              {RECORDING_STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={`preset-button recordings-filter-button ${recordingStatusFilter === filter.id ? "is-active" : ""}`}
                  onClick={() => setRecordingStatusFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <label className="recordings-sort-field">
              <span>Sort recordings</span>
              <select value={recordingSortMode} onChange={handleRecordingSortChange}>
                {RECORDING_SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {actionMessage ? <p className={`recording-action-message recording-action-message--${actionTone}`}>{actionMessage}</p> : null}

        {isLoadingRecordings ? (
          <div className="recordings-empty">
            <h3>Loading recordings...</h3>
            <p>Checking local IndexedDB storage for saved practice audio.</p>
          </div>
        ) : hasFilteredRecordings ? (
          <div className={`recording-library-day-group-list ${shouldScrollRecordings ? "is-scrollable" : ""}`}>
            {recordingGroups.map((group) => (
              <section key={group.dateKey} className="recording-library-day-group">
                <div className="recording-library-day-header">
                  <div>
                    <strong>{formatRecordingGroupDate(group.dateKey)}</strong>
                    <small>{formatRecordingCountLabel(group.items.length)}</small>
                  </div>

                  <span>{formatRecordingDuration(group.totalDurationSeconds)} total</span>
                </div>

                <div className="recording-library-list">{group.items.map((item) => renderRecordingCard(item))}</div>
              </section>
            ))}
          </div>
        ) : hasAnyRecordings ? (
          <div className="recordings-empty">
            <h3>No recordings match this filter</h3>
            <p>Try a different search term or switch the status filter back to All.</p>
          </div>
        ) : (
          <div className="recordings-empty">
            <h3>No local recordings yet</h3>
            <p>Record a practice session from the Dashboard, then save the completed session to add audio here.</p>
          </div>
        )}
      </section>

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteRecording)}
        title="Delete this recording?"
        message={
          pendingDeleteRecording?.isLinked
            ? "This removes the saved audio from this device, but keeps the practice session in your history."
            : "This removes this orphaned audio file from local recording storage."
        }
        confirmLabel="Delete Recording"
        cancelLabel="Cancel"
        tone="danger"
        onCancel={handleCancelDeleteRecording}
        onConfirm={handleConfirmDeleteRecording}
      />
    </Fragment>
  );
}

function SummaryCard({ accent = "blue", helper, label, value }) {
  return (
    <article className={`recordings-summary-card recordings-summary-card--${accent}`}>
      <strong>{value}</strong>
      <span>{label}</span>
      <small>{helper}</small>
    </article>
  );
}
