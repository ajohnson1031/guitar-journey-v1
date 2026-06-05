import * as React from "react";
import useSharedMetronomeState from "../hooks/useSharedMetronomeState";
import useStrummingPlayback from "../hooks/useStrummingPlayback";
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

export default function Metronome({ songBpm, songTitle, strummingPattern }) {
  const [bpmInput, setBpmInput] = useState(() => String(clampBpm(songBpm)));
  const { currentBeat, isMetronomeRunning: isRunning, metronomeStartAtMs, setMetronomeBpm, stopMetronome, toggleMetronomeRunning } = useSharedMetronomeState();

  const safeBpm = clampBpm(bpmInput);

  const playback = useStrummingPlayback({
    bpm: safeBpm,
    isRunning,
    pattern: strummingPattern,
    startAtMs: metronomeStartAtMs,
  });

  useEffect(() => {
    setBpmInput(String(clampBpm(songBpm)));
    stopMetronome();
  }, [songBpm, songTitle, stopMetronome]);

  useEffect(() => {
    setMetronomeBpm(safeBpm);
  }, [safeBpm, setMetronomeBpm]);

  function handleBpmChange(value) {
    setBpmInput(value);
  }

  function handleBpmBlur() {
    setBpmInput(String(safeBpm));
  }

  function decreaseBpm() {
    setBpmInput((current) => String(clampBpm(clampBpm(current) - 1)));
  }

  function increaseBpm() {
    setBpmInput((current) => String(clampBpm(clampBpm(current) + 1)));
  }

  async function toggleMetronome() {
    setBpmInput(String(safeBpm));
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
