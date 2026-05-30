import * as React from "react";
import { GenreManager, Metronome } from "./";

const { Fragment } = React;

const MAX_GENRE_DESCRIPTION_LENGTH = 100;

function getCompactGenreDescription(value) {
  const description = String(value || "")
    .trim()
    .replace(/\s+/g, " ");

  if (description.length <= MAX_GENRE_DESCRIPTION_LENGTH) return description;

  return `${description.slice(0, MAX_GENRE_DESCRIPTION_LENGTH - 1).trimEnd()}…`;
}

export default function AppSidebar({
  allSongs,
  builtInGenreNames,
  customGenres,
  masteredCount,
  onAddGenre,
  onPathChange,
  onRemoveGenre,
  onResetLocalProgress,
  onUpdateGenre,
  pathCards,
  selectedPath,
  selectedSong,
  sessionHistory,
  totalPracticeMinutes,
  transitionScores,
}) {
  return (
    <Fragment>
      <aside className="sidebar">
        <section className="hero-card">
          <p className="eyebrow">Guitar Journey</p>
          <h1>Practice with purpose.</h1>
          <p>Pick a style, choose a song, and get a focused session that connects chords, transitions, rhythm, and real song progress.</p>
        </section>

        <section className="panel-card">
          <h2>{`Genre Paths (${pathCards.length})`}</h2>
          <div className="path-list">
            {pathCards.map((path) => {
              const isActive = selectedPath === path.name;
              const description = getCompactGenreDescription(path.description);

              return (
                <button
                  key={path.name}
                  type="button"
                  onClick={() => onPathChange(path.name)}
                  className={`path-card ${isActive ? "is-active" : ""}`}
                  aria-current={isActive ? "true" : undefined}
                >
                  <span>{path.name}</span>
                  {description ? <small className="path-card-description">{description}</small> : null}
                </button>
              );
            })}
          </div>
        </section>

        <GenreManager
          builtInGenres={builtInGenreNames}
          customGenres={customGenres}
          songs={allSongs}
          selectedPath={selectedPath}
          onAddGenre={onAddGenre}
          onRemoveGenre={onRemoveGenre}
          onUpdateGenre={onUpdateGenre}
        />

        <Metronome songTitle={selectedSong.title} songBpm={selectedSong.bpm} strummingPattern={selectedSong.strummingPattern || selectedSong.strumming} />

        <section className="panel-card local-progress-card">
          <h2>Local Progress</h2>
          <div className="progress-stat-grid">
            <div>
              <span>{masteredCount}</span>
              <small>songs mastered</small>
            </div>
            <div>
              <span>{Object.keys(transitionScores).length}</span>
              <small>tracked transitions</small>
            </div>
            <div>
              <span>{sessionHistory.length}</span>
              <small>sessions completed</small>
            </div>
            <div>
              <span>{totalPracticeMinutes}</span>
              <small>actual minutes</small>
            </div>
          </div>

          <button type="button" className="danger-button" onClick={onResetLocalProgress}>
            Reset Local Progress
          </button>
        </section>
      </aside>
    </Fragment>
  );
}
