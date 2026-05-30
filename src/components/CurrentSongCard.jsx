import * as React from "react";
import ConfirmDialog from "./ConfirmDialog";
import StrummingPatternDisplay from "./StrummingPatternDisplay";

const { Fragment, useState } = React;

export default function CurrentSongCard({ filteredSongs, masteredSongs, onDeleteCustomSong, onSelectSong, onStartEditCustomSong, onToggleMastered, selectedSong }) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const isMastered = Boolean(masteredSongs[selectedSong.id]);

  function handleRequestDeleteCustomSong() {
    setIsDeleteDialogOpen(true);
  }

  function handleCancelDeleteCustomSong() {
    setIsDeleteDialogOpen(false);
  }

  function handleConfirmDeleteCustomSong() {
    onDeleteCustomSong(selectedSong.id);
    setIsDeleteDialogOpen(false);
  }

  return (
    <Fragment>
      <section className="song-card compact-song-card">
        <div className="song-card-control-row-wrapper">
          <p className="eyebrow">Choose Song</p>
          <div className="song-card-control-row">
            <select id="song-select" className="song-select-inline-control" aria-label="Choose song" value={selectedSong.id} onChange={(event) => onSelectSong(event.target.value)}>
              {filteredSongs.map((song) => (
                <option key={song.id} value={song.id}>
                  {song.title} — {song.difficulty}
                  {song.isCustom ? " — custom" : ""}
                </option>
              ))}
            </select>

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
                    onClick={handleRequestDeleteCustomSong}
                  >
                    <XIcon />
                  </button>
                </Fragment>
              ) : null}

              <button
                type="button"
                title={isMastered ? "Marked Mastered" : "Mark Mastered"}
                aria-label={isMastered ? "Marked Mastered" : "Mark Mastered"}
                onClick={() => onToggleMastered(selectedSong.id)}
                className={`icon-button mastered-icon-button ${isMastered ? "is-mastered" : "ghost-button"}`}
              >
                <StarIcon />
              </button>
            </div>
          </div>
        </div>
        <div className="song-header-main">
          <p className="eyebrow">Current Song</p>
          <h2>{selectedSong.title}</h2>
          <p className="goal">{selectedSong.goal}</p>
        </div>

        <div className="song-detail-grid-wrap">
          <div className="info-grid compact-info-grid song-detail-grid">
            <InfoCard label="Style" value={selectedSong.genre} />
            <InfoCard label="Level" value={selectedSong.difficulty} />
            <InfoCard label="Tuning" value={selectedSong.tuning} />
          </div>

          <div className="info-grid compact-info-grid song-detail-grid">
            <InfoCard label="Key" value={selectedSong.key} />
            <InfoCard label="Capo" value={selectedSong.capo} />
            <InfoCard label="BPM" value={selectedSong.bpm} />
          </div>
        </div>

        <div>
          <span className="strum-pill">
            <span>Strum Pattern:</span>
            <StrummingPatternDisplay pattern={selectedSong.strummingPattern || selectedSong.strumming} compact />
          </span>
        </div>
      </section>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete custom song?"
        message={`Delete “${selectedSong.title}”? This removes the song and its saved progress from this device.`}
        confirmLabel="Delete Song"
        cancelLabel="Keep Song"
        tone="danger"
        onCancel={handleCancelDeleteCustomSong}
        onConfirm={handleConfirmDeleteCustomSong}
      />
    </Fragment>
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

function StarIcon() {
  return (
    <svg className="star-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m12 3.5 2.67 5.41 5.97.87-4.32 4.21 1.02 5.95L12 17.13l-5.34 2.81 1.02-5.95-4.32-4.21 5.97-.87L12 3.5Z" />
    </svg>
  );
}
