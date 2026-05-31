import * as React from "react";
import { GuitarIcon, HistoryIcon, StarIcon } from "./AppIcons";

const { Fragment, useMemo, useState } = React;

const PROGRESS_STATUS_FILTERS = [
  {
    id: "all",
    label: "All",
  },
  {
    id: "mastered",
    label: "Mastered",
  },
  {
    id: "in-progress",
    label: "In Progress",
  },
];

const PROGRESS_SORT_OPTIONS = [
  {
    id: "recent",
    label: "Recently practiced",
  },
  {
    id: "most-time",
    label: "Most practice time",
  },
  {
    id: "most-sessions",
    label: "Most sessions",
  },
  {
    id: "mastered",
    label: "Mastered first",
  },
  {
    id: "title",
    label: "Title A-Z",
  },
];

function noop() {}

function getSessionSeconds(session) {
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

function formatPracticeMinutes(totalSeconds) {
  const safeSeconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const minutes = Math.round(safeSeconds / 60);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function formatLastPracticed(value) {
  if (!value) return "Not practiced yet";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

function getPracticeTimestamp(value) {
  const timestamp = new Date(value || 0).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getTruthyStepCount(songSteps = {}) {
  return Object.values(songSteps || {}).filter(Boolean).length;
}

function getSongProgressItems({ allSongs = [], completedStepsBySong = {}, masteredSongs = {}, sessionHistory = [] }) {
  const sessionsBySongId = new Map();

  sessionHistory.forEach((session) => {
    const songId = String(session?.songId || "").trim();

    if (!songId) return;

    if (!sessionsBySongId.has(songId)) {
      sessionsBySongId.set(songId, []);
    }

    sessionsBySongId.get(songId).push(session);
  });

  return allSongs
    .map((song) => {
      const songSessions = sessionsBySongId.get(song.id) || [];
      const totalPracticeSeconds = songSessions.reduce((sum, session) => sum + getSessionSeconds(session), 0);
      const lastPracticedAt = songSessions.reduce((latest, session) => {
        const timestamp = getPracticeTimestamp(session.completedAt);

        return timestamp > latest ? timestamp : latest;
      }, 0);
      const completedStepCount = getTruthyStepCount(completedStepsBySong[song.id]);
      const isMastered = Boolean(masteredSongs[song.id]);
      const isInProgress = !isMastered && (songSessions.length > 0 || completedStepCount > 0);

      return {
        completedStepCount,
        isInProgress,
        isMastered,
        lastPracticedAt,
        sessionCount: songSessions.length,
        song,
        totalPracticeSeconds,
      };
    })
    .filter((item) => item.isMastered || item.isInProgress || item.sessionCount > 0);
}

function filterProgressItems(items = [], { genreFilter = "all", searchTerm = "", statusFilter = "all" } = {}) {
  const normalizedSearchTerm = String(searchTerm || "")
    .trim()
    .toLowerCase();

  return items.filter((item) => {
    if (statusFilter === "mastered" && !item.isMastered) return false;
    if (statusFilter === "in-progress" && !item.isInProgress) return false;
    if (genreFilter !== "all" && item.song.genre !== genreFilter) return false;

    if (!normalizedSearchTerm) return true;

    const searchableText = [item.song.title, item.song.genre, item.song.difficulty, item.song.key].filter(Boolean).join(" ").toLowerCase();

    return searchableText.includes(normalizedSearchTerm);
  });
}

function sortProgressItems(items = [], sortMode = "recent") {
  return [...items].sort((leftItem, rightItem) => {
    if (sortMode === "most-time") {
      return rightItem.totalPracticeSeconds - leftItem.totalPracticeSeconds || rightItem.lastPracticedAt - leftItem.lastPracticedAt;
    }

    if (sortMode === "most-sessions") {
      return rightItem.sessionCount - leftItem.sessionCount || rightItem.totalPracticeSeconds - leftItem.totalPracticeSeconds;
    }

    if (sortMode === "mastered") {
      return Number(rightItem.isMastered) - Number(leftItem.isMastered) || rightItem.lastPracticedAt - leftItem.lastPracticedAt;
    }

    if (sortMode === "title") {
      return itemTitle(leftItem).localeCompare(itemTitle(rightItem));
    }

    return rightItem.lastPracticedAt - leftItem.lastPracticedAt || rightItem.totalPracticeSeconds - leftItem.totalPracticeSeconds;
  });
}

function itemTitle(item) {
  return String(item?.song?.title || "");
}

function createProgressSummary(items = []) {
  const masteredCount = items.filter((item) => item.isMastered).length;
  const inProgressCount = items.filter((item) => item.isInProgress).length;
  const totalPracticeSeconds = items.reduce((sum, item) => sum + item.totalPracticeSeconds, 0);

  return {
    inProgressCount,
    masteredCount,
    totalPracticeLabel: formatPracticeMinutes(totalPracticeSeconds),
    trackedCount: items.length,
  };
}

export default function ProgressLibrary({
  allSongs = [],
  completedStepsBySong = {},
  masteredSongs = {},
  onPracticeSong = noop,
  onToggleMastered = noop,
  onViewHistory = noop,
  pathOptions = [],
  sessionHistory = [],
}) {
  const [genreFilter, setGenreFilter] = useState("all");
  const [progressSearchTerm, setProgressSearchTerm] = useState("");
  const [progressSortMode, setProgressSortMode] = useState("recent");
  const [statusFilter, setStatusFilter] = useState("all");

  const progressItems = useMemo(
    () =>
      getSongProgressItems({
        allSongs,
        completedStepsBySong,
        masteredSongs,
        sessionHistory,
      }),
    [allSongs, completedStepsBySong, masteredSongs, sessionHistory],
  );

  const visibleProgressItems = useMemo(() => {
    const filteredItems = filterProgressItems(progressItems, {
      genreFilter,
      searchTerm: progressSearchTerm,
      statusFilter,
    });

    return sortProgressItems(filteredItems, progressSortMode);
  }, [genreFilter, progressItems, progressSearchTerm, progressSortMode, statusFilter]);

  const progressSummary = useMemo(() => createProgressSummary(progressItems), [progressItems]);
  const shouldScrollProgress = visibleProgressItems.length > 6;

  function handleProgressSearchChange(event) {
    setProgressSearchTerm(event.target.value);
  }

  function handleGenreFilterChange(event) {
    setGenreFilter(event.target.value);
  }

  function handleProgressSortChange(event) {
    setProgressSortMode(event.target.value);
  }

  return (
    <Fragment>
      <section className="panel-card progress-library-card">
        <div className="progress-library-hero">
          <div>
            <p className="eyebrow">Progress</p>
            <h2>Progress library</h2>
            <p>Track the songs you are building, the songs you have mastered, and where your practice time is going.</p>
          </div>
        </div>

        <div className="progress-summary-grid">
          <SummaryCard label="tracked" value={progressSummary.trackedCount} helper="songs with progress" />
          <SummaryCard label="mastered" value={progressSummary.masteredCount} helper="marked complete" accent="green" />
          <SummaryCard label="in progress" value={progressSummary.inProgressCount} helper="currently building" accent="mango" />
          <SummaryCard label="practice time" value={progressSummary.totalPracticeLabel} helper="across tracked songs" />
        </div>

        {progressItems.length ? (
          <div className="progress-library-controls" aria-label="Progress library controls">
            <label className="progress-search-field">
              <span>Search progress</span>
              <input type="search" value={progressSearchTerm} onChange={handleProgressSearchChange} placeholder="Search by song, genre, key..." />
            </label>

            <div className="progress-filter-group" role="group" aria-label="Progress status filter">
              {PROGRESS_STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={`preset-button progress-filter-button ${statusFilter === filter.id ? "is-active" : ""}`}
                  onClick={() => setStatusFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <label className="progress-select-field">
              <span>Genre</span>
              <select value={genreFilter} onChange={handleGenreFilterChange}>
                <option value="all">All genres</option>
                {pathOptions.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </label>

            <label className="progress-select-field">
              <span>Sort</span>
              <select value={progressSortMode} onChange={handleProgressSortChange}>
                {PROGRESS_SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {visibleProgressItems.length ? (
          <div className={`progress-song-list ${shouldScrollProgress ? "is-scrollable" : ""}`}>
            {visibleProgressItems.map((item) => (
              <ProgressSongCard key={item.song.id} item={item} onPracticeSong={onPracticeSong} onToggleMastered={onToggleMastered} onViewHistory={onViewHistory} />
            ))}
          </div>
        ) : progressItems.length ? (
          <div className="progress-empty">
            <h3>No progress matches this filter</h3>
            <p>Try a different search term, status, or genre filter.</p>
          </div>
        ) : (
          <div className="progress-empty">
            <h3>No song progress yet</h3>
            <p>Complete a practice session or mark a song as mastered to start building this library.</p>
          </div>
        )}
      </section>
    </Fragment>
  );
}

function SummaryCard({ accent = "blue", helper, label, value }) {
  return (
    <article className={`progress-summary-card progress-summary-card--${accent}`}>
      <strong>{value}</strong>
      <span>{label}</span>
      <small>{helper}</small>
    </article>
  );
}

function ProgressSongCard({ item, onPracticeSong, onToggleMastered, onViewHistory }) {
  const { completedStepCount, isInProgress, isMastered, lastPracticedAt, sessionCount, song, totalPracticeSeconds } = item;
  const progressLabel = isMastered ? "(Mastered)" : "(In Progress)";
  const masteredActionLabel = isMastered ? "Marked Mastered" : "Mark Mastered";
  const masteredTitle = isMastered ? `Marked Mastered: ${song.title}` : `Mark Mastered: ${song.title}`;

  return (
    <article className="progress-song-card">
      <div className="progress-song-card-header">
        <div className="progress-song-title-group">
          <h3 className="progress-song-title">
            <span>
              {`${song.title} `}
              <span className={`progress-song-title-status ${isMastered ? "is-mastered" : "is-in-progress"}`}>{progressLabel}</span>
            </span>
          </h3>
          <small>
            {song.genre} • {song.difficulty} • Key {song.key}
          </small>
        </div>

        <div className="progress-song-actions" aria-label={`${song.title} actions`}>
          <button
            type="button"
            className="icon-button progress-action-icon-button progress-practice-icon-button"
            title={`Practice ${song.title}`}
            aria-label={`Practice ${song.title}`}
            onClick={() => onPracticeSong(song.id)}
          >
            <GuitarIcon />
          </button>

          <button
            type="button"
            className="icon-button progress-action-icon-button progress-history-icon-button"
            title={`View History for ${song.title}`}
            aria-label={`View History for ${song.title}`}
            onClick={() => onViewHistory(song.id)}
          >
            <HistoryIcon />
          </button>

          <button
            type="button"
            title={masteredTitle}
            aria-label={masteredActionLabel}
            onClick={() => onToggleMastered(song.id)}
            className={`icon-button mastered-icon-button progress-mastered-icon-button ${isMastered ? "is-mastered" : "ghost-button"}`}
          >
            <StarIcon className="star-icon" />
          </button>
        </div>
      </div>

      <p>{song.goal}</p>

      <div className="progress-song-metrics">
        <span>{formatPracticeMinutes(totalPracticeSeconds)} practiced</span>
        <span>
          {sessionCount} session{sessionCount === 1 ? "" : "s"}
        </span>
        <span>Last: {formatLastPracticed(lastPracticedAt)}</span>
        <span>
          {completedStepCount} active step{completedStepCount === 1 ? "" : "s"}
        </span>
      </div>
    </article>
  );
}
