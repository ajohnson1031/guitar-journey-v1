import * as React from "react";
import useSharedMetronomeState from "../hooks/useSharedMetronomeState";
import { AudioLinesIcon, MetronomeIcon, PlayIcon, RepeatIcon, StopIcon } from "./AppIcons";

export default function SongPlaythroughControls({ compact = false, layout = "row", playback, showStatus = true }) {
  const { isMetronomeRunning, toggleMetronomeRunning } = useSharedMetronomeState();
  const isMelodyPlaying = playback.isPlaying && playback.playbackMode === playback.melodyMode;
  const isBackingPlaying = playback.isPlaying && playback.playbackMode === playback.backingMode;
  const playButtonLabel = isMelodyPlaying ? "Stop melody playthrough" : "Play melody playthrough";
  const loopButtonLabel = playback.isLooping ? "Turn loop off" : "Turn loop on";
  const metronomeButtonLabel = isMetronomeRunning ? "Stop metronome" : "Start metronome";
  const backingButtonLabel = isBackingPlaying ? "Stop backing track" : "Play backing track";

  function handleMelodyButtonClick() {
    if (isMelodyPlaying) {
      playback.stopPlayback({ message: "Melody playthrough stopped." });
      return;
    }

    playback.startPlayback({ mode: playback.melodyMode });
  }

  function handleBackingButtonClick() {
    if (isBackingPlaying) {
      playback.stopPlayback({ message: "Backing track stopped." });
      return;
    }

    playback.startPlayback({ mode: playback.backingMode });
  }

  return (
    <div className={`song-playthrough-controls ${compact ? "is-compact" : ""} is-${layout}`}>
      <div className={`song-playthrough-control-buttons is-${layout}`}>
        <button
          type="button"
          className={`song-playthrough-icon-button song-playthrough-button--play ${isMelodyPlaying ? "is-active" : ""}`}
          aria-label={playButtonLabel}
          title={playButtonLabel}
          aria-pressed={isMelodyPlaying}
          onClick={handleMelodyButtonClick}
          disabled={!playback.hasSteps}
        >
          {isMelodyPlaying ? <StopIcon /> : <PlayIcon />}
        </button>

        <button
          type="button"
          className={`song-playthrough-icon-button song-playthrough-loop-button ${playback.isLooping ? "is-active" : ""}`}
          aria-label={loopButtonLabel}
          title={loopButtonLabel}
          aria-pressed={playback.isLooping}
          onClick={playback.toggleLoop}
          disabled={!playback.hasSteps}
        >
          <RepeatIcon />
        </button>

        <button
          type="button"
          className={`song-playthrough-icon-button song-playthrough-metronome-button ${isMetronomeRunning ? "is-active" : ""}`}
          aria-label={metronomeButtonLabel}
          title={metronomeButtonLabel}
          aria-pressed={isMetronomeRunning}
          onClick={() => toggleMetronomeRunning({ bpm: playback.safeBpm })}
        >
          <MetronomeIcon />
        </button>

        <button
          type="button"
          className={`song-playthrough-icon-button song-playthrough-backing-button ${isBackingPlaying ? "is-active" : ""}`}
          aria-label={backingButtonLabel}
          title={backingButtonLabel}
          aria-pressed={isBackingPlaying}
          onClick={handleBackingButtonClick}
          disabled={!playback.hasSteps}
        >
          <AudioLinesIcon />
        </button>
      </div>

      {showStatus ? (
        <p className="song-playthrough-message" aria-live="polite">
          {playback.statusMessage ||
            (playback.activeStep
              ? `Now playing ${playback.activeStep.chord} in ${playback.activeStep.sectionName}.`
              : "Ready for a quick synthetic chord preview.")}
        </p>
      ) : null}
    </div>
  );
}
