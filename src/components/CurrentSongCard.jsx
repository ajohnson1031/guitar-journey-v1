import * as React from "react";

const { Fragment } = React;

export default function CurrentSongCard({ filteredSongs, masteredSongs, onDeleteCustomSong, onSelectSong, onStartEditCustomSong, onToggleMastered, selectedSong }) {
  return (
    <section className="song-card compact-song-card">
      <div className="song-header">
        <div>
          <p className="eyebrow">Current Song</p>
          <h2>{selectedSong.title}</h2>
          <p>{selectedSong.goal}</p>
        </div>

        <div className="song-header-actions song-icon-actions">
          {selectedSong.isCustom ? (
            <Fragment>
              <button
                type="button"
                className="icon-button ghost-button edit-icon-button"
                title="Edit Custom Song"
                aria-label="Edit Custom Song"
                onClick={() => onStartEditCustomSong(selectedSong.id)}
              >
                <PencilIcon />
              </button>

              <button
                type="button"
                className="icon-button danger-button"
                title="Delete Custom Song"
                aria-label="Delete Custom Song"
                onClick={() => onDeleteCustomSong(selectedSong.id)}
              >
                <XIcon />
              </button>
            </Fragment>
          ) : null}

          <button
            type="button"
            title={masteredSongs[selectedSong.id] ? "Marked Mastered" : "Mark Mastered"}
            aria-label={masteredSongs[selectedSong.id] ? "Marked Mastered" : "Mark Mastered"}
            onClick={() => onToggleMastered(selectedSong.id)}
            className={`icon-button mastered-icon-button ${masteredSongs[selectedSong.id] ? "mastered-button" : "ghost-button"}`}
          >
            <DoubleCheckIcon />
          </button>
        </div>
      </div>

      <div className="song-detail-grid-wrap">
        <div className="info-grid compact-info-grid song-detail-grid">
          <InfoCard label="Level" value={selectedSong.difficulty} />
          <InfoCard label="Style" value={selectedSong.genre} />
          <InfoCard label="Tuning" value={selectedSong.tuning} />
        </div>

        <div className="info-grid compact-info-grid song-detail-grid">
          <InfoCard label="Key" value={selectedSong.key} />
          <InfoCard label="BPM" value={selectedSong.bpm} />
          <InfoCard label="Capo" value={selectedSong.capo} />
        </div>
      </div>

      <label className="select-label" htmlFor="song-select">
        Choose Song
      </label>

      <select id="song-select" value={selectedSong.id} onChange={(event) => onSelectSong(event.target.value)}>
        {filteredSongs.map((song) => (
          <option key={song.id} value={song.id}>
            {song.title} — {song.difficulty}
            {song.isCustom ? " — custom" : ""}
          </option>
        ))}
      </select>
    </section>
  );
}

function InfoCard({ label, value }) {
  const displayValue = value || value === 0 ? value : "—";

  return (
    <div className="info-card">
      <span>{label}</span>
      <strong>{displayValue}</strong>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 20h4.25L19.7 8.55a2.12 2.12 0 0 0 0-3L18.45 4.3a2.12 2.12 0 0 0-3 0L4 15.75V20Z" />
      <path d="m14.5 5.25 4.25 4.25" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6 6 18 18" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

function DoubleCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m3.5 12.5 4 4L15 7.5" />
      <path d="m10.5 14.5 2 2L21 7.5" />
    </svg>
  );
}
