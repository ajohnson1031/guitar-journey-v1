import * as React from "react";
import useSharedMetronomeState from "../hooks/useSharedMetronomeState";
import useStrummingPlayback from "../hooks/useStrummingPlayback";
import useTempoOverride from "../hooks/useTempoOverride";
import { PlayIcon, StopIcon } from "./AppIcons";
import StrummingPlaybackGuide from "./StrummingPlaybackGuide";

const { useEffect, useState } = React;

const MIN_BPM = 40;
const MAX_BPM = 220;
const DEFAULT_BPM = 72;

function clampBpm(value) {
  const bpm = Number(value);

  if (!Number.isFinite(bpm)) return DEFAULT_BPM;

  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));
}

export default function Metronome({ selectedSong, songBpm, songTitle, strummingPattern }) {
  const fallbackSong = selectedSong || {
    bpm: songBpm,
    id: songTitle || "selected-song",
    strumming: strummingPattern,
    title: songTitle,
  };
  const tempo = useTempoOverride(fallbackSong);
  const [bpmInput, setBpmInput] = useState(() => String(tempo.effectiveBpm));
  const { currentBeat, isMetronomeRunning: isRunning, metronomeStartAtMs, setMetronomeBpm, stopMetronome, toggleMetronomeRunning } = useSharedMetronomeState();

  const safeBpm = clampBpm(bpmInput);
  const selectedStrummingPattern = fallbackSong.strummingPattern || fallbackSong.strumming || strummingPattern;

  const playback = useStrummingPlayback({
    bpm: safeBpm,
    isRunning,
    pattern: selectedStrummingPattern,
    startAtMs: metronomeStartAtMs,
  });

  useEffect(() => {
    setBpmInput(String(tempo.effectiveBpm));
  }, [tempo.effectiveBpm]);

  useEffect(() => {
    stopMetronome();
  }, [fallbackSong.id, stopMetronome]);

  useEffect(() => {
    setMetronomeBpm(safeBpm);
  }, [safeBpm, setMetronomeBpm]);

  function updateTemporaryBpm(value) {
    const nextBpm = clampBpm(value);

    setBpmInput(String(nextBpm));
    tempo.setAdjustedBpm(nextBpm);
  }

  function handleBpmChange(value) {
    setBpmInput(value);

    if (value !== "") {
      tempo.setAdjustedBpm(value);
    }
  }

  function handleBpmBlur() {
    setBpmInput(String(safeBpm));
    tempo.setAdjustedBpm(safeBpm);
  }

  function decreaseBpm() {
    updateTemporaryBpm(safeBpm - 1);
  }

  function increaseBpm() {
    updateTemporaryBpm(safeBpm + 1);
  }

  async function toggleMetronome() {
    setBpmInput(String(safeBpm));
    tempo.setAdjustedBpm(safeBpm);
    await toggleMetronomeRunning({ bpm: safeBpm });
  }

  return (
    <section className="panel-card metronome-card">
      <div className="metronome-header">
        <div>
          <h2>Metronome</h2>
          <p>Practice in time with the selected song BPM.</p>
        </div>

        <div className={`beat-orb ${isRunning ? "is-running" : ""}`}>{currentBeat}</div>
      </div>

      <div className="metronome-bpm-row">
        <button type="button" className="ghost-button bpm-button" aria-label="Decrease BPM" onClick={decreaseBpm}>
          −
        </button>

        <label className="bpm-input-wrap">
          <span>BPM</span>
          <input type="number" min={MIN_BPM} max={MAX_BPM} value={bpmInput} onChange={(event) => handleBpmChange(event.target.value)} onBlur={handleBpmBlur} />
        </label>

        <button type="button" className="ghost-button bpm-button" aria-label="Increase BPM" onClick={increaseBpm}>
          +
        </button>
      </div>

      {tempo.isAdjusted ? (
        <p className="metronome-adjusted-note">
          Adjusted (Original: <strong>{tempo.originalBpm} BPM)</strong>
        </p>
      ) : null}

      <div className="beat-dots" aria-label="Metronome beats">
        {[1, 2, 3, 4].map((beat) => (
          <span key={beat} className={`beat-dot ${beat === 1 ? "is-accent" : ""} ${isRunning && currentBeat === beat ? "is-active" : ""}`} />
        ))}
      </div>

      <button
        type="button"
        className={`metronome-toggle-button ${isRunning ? "metronome-stop-button" : "selected-button"}`}
        title={isRunning ? "Stop" : "Start"}
        aria-label={isRunning ? "Stop" : "Start"}
        onClick={toggleMetronome}
      >
        {isRunning ? <StopIcon /> : <PlayIcon />}
      </button>

      <StrummingPlaybackGuide activeSlot={playback.activeSlot} isRunning={isRunning} slots={playback.slots} />

      <p className="metronome-note">Beat 1 is accented. The strumming guide advances through the selected strumming subdivision while the metronome runs.</p>
    </section>
  );
}
