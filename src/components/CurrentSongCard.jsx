import * as React from "react";
import useSharedMetronomeState from "../hooks/useSharedMetronomeState";
import useSongPlaythroughPlayback from "../hooks/useSongPlaythroughPlayback";
import useStrummingPlayback from "../hooks/useStrummingPlayback";
import { EditIcon, StarIcon, TrashIcon } from "./AppIcons";
import ConfirmDialog from "./ConfirmDialog";
import SongPlaythroughControls from "./SongPlaythroughControls";
import StrummingPatternDisplay from "./StrummingPatternDisplay";

const { Fragment, useMemo, useState } = React;

export default function CurrentSongCard({ filteredSongs, masteredSongs, onDeleteCustomSong, onSelectSong, onStartEditCustomSong, onToggleMastered, selectedSong }) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const isMastered = Boolean(masteredSongs[selectedSong.id]);
  const artistByline = selectedSong.artist?.trim();
  const playthrough = useSongPlaythroughPlayback({ selectedSong });
  const { isMetronomeRunning, metronomeStartAtMs } = useSharedMetronomeState();
  const selectedStrummingPattern = selectedSong.strummingPattern || selectedSong.strumming;
  const strummingPlayback = useStrummingPlayback({
    bpm: selectedSong.bpm,
    isRunning: isMetronomeRunning,
    pattern: selectedStrummingPattern,
    startAtMs: metronomeStartAtMs,
  });

  const songSelectOptions = useMemo(() => {
    const options = filteredSongs.length ? filteredSongs : selectedSong ? [selectedSong] : [];
    const hasSelectedSongOption = options.some((song) => song.id === selectedSong?.id);

    if (!selectedSong || hasSelectedSongOption) return options;

    return [selectedSong, ...options];
  }, [filteredSongs, selectedSong]);

  const songSelectValue = songSelectOptions.some((song) => song.id === selectedSong?.id) ? selectedSong.id : "";
  const isSongSelectDisabled = !songSelectOptions.length;

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
            <select
              id="song-select"
              className="song-select-inline-control"
              aria-label="Choose song"
              value={songSelectValue}
              onChange={(event) => onSelectSong(event.target.value)}
              disabled={isSongSelectDisabled}
            >
              {songSelectOptions.map((song) => (
                <option key={song.id} value={song.id}>
                  {song.title} — {song.difficulty}
                  {song.isCustom ? " — custom" : ""}
                </option>
              ))}
            </select>

            <div className="song-header-actions song-icon-actions">
              {selectedSong.isCustom ? (
                <button
                  type="button"
                  className="icon-button ghost-button edit-icon-button"
                  title="Edit Custom Song"
                  aria-label="Edit Custom Song"
                  onClick={() => onStartEditCustomSong(selectedSong.id)}
                >
                  <EditIcon />
                </button>
              ) : null}

              <button
                type="button"
                title={isMastered ? "Marked Mastered" : "Mark Mastered"}
                aria-label={isMastered ? "Marked Mastered" : "Mark Mastered"}
                onClick={() => onToggleMastered(selectedSong.id)}
                className={`icon-button mastered-icon-button ${isMastered ? "is-mastered" : "ghost-button"}`}
              >
                <StarIcon className="star-icon" />
              </button>

              {selectedSong.isCustom ? (
                <button
                  type="button"
                  className="icon-button destructive-outline-button current-song-delete-button"
                  title="Delete Custom Song"
                  aria-label="Delete Custom Song"
                  onClick={handleRequestDeleteCustomSong}
                >
                  <TrashIcon />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="song-header-main">
          <p className="eyebrow song-current-label">
            Current Song
            {isMastered ? <span className="mastered-label">(Mastered)</span> : null}
          </p>
          <h2>{selectedSong.title}</h2>
          {artistByline ? <p className="song-artist">{artistByline}</p> : null}
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

        <div className="current-song-rhythm-row">
          <div className="current-song-playthrough-controls">
            <SongPlaythroughControls compact layout="grid" playback={playthrough} showStatus={false} />
          </div>

          <div className="current-song-strum-wrap">
            <span className="strum-pill strum-pattern-pill">
              <span>Strum Pattern:</span>
              <StrummingPatternDisplay activeSlot={isMetronomeRunning ? strummingPlayback.activeSlot : null} pattern={selectedStrummingPattern} compact />
            </span>
          </div>
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
