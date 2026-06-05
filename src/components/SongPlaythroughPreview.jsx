import * as React from "react";
import useSongPlaythroughPlayback from "../hooks/useSongPlaythroughPlayback";
import SongPlaythroughControls from "./SongPlaythroughControls";

const BEATS_PER_CHORD = 2;

export default function SongPlaythroughPreview({ selectedSong }) {
  const playback = useSongPlaythroughPlayback({
    beatsPerChord: BEATS_PER_CHORD,
    selectedSong,
  });

  return (
    <section className="song-playthrough-card" aria-label="Playthrough preview">
      <div className="song-playthrough-header">
        <div>
          <span className="song-playthrough-eyebrow">Playthrough Preview</span>
          <h3>Hear the progression</h3>
          <p>Play a lightweight synthetic chord guide from this song’s sections. No original recording or external audio is used.</p>
        </div>

        <SongPlaythroughControls playback={playback} showStatus={false} />
      </div>

      <div className="song-playthrough-meta" aria-label="Playthrough details">
        <span>{playback.safeBpm} BPM</span>
        <span>{playback.steps.length} chords</span>
        <span>{playback.sectionCount || 0} sections</span>
        <span>{BEATS_PER_CHORD} beats/chord</span>
      </div>

      <div className="song-playthrough-track" aria-label="Playthrough chord timeline">
        {playback.hasSteps ? (
          playback.steps.map((step, stepIndex) => (
            <span
              key={`${step.sectionName}-${step.chord}-${stepIndex}`}
              className={`song-playthrough-step ${stepIndex === playback.activeStepIndex ? "is-active" : ""}`}
            >
              <small>{step.sectionName}</small>
              <strong>{step.chord}</strong>
            </span>
          ))
        ) : (
          <p>No playable sections yet.</p>
        )}
      </div>

      <p className="song-playthrough-message" aria-live="polite">
        {playback.statusMessage ||
          (playback.activeStep
            ? `Now playing ${playback.activeStep.chord} in ${playback.activeStep.sectionName}.`
            : "Ready for a quick synthetic chord preview.")}
      </p>
    </section>
  );
}
