import * as React from "react";
import useStrummingPlayback from "../hooks/useStrummingPlayback";
import StrummingPlaybackGuide from "./StrummingPlaybackGuide";

const { useEffect, useState } = React;

const MIN_BPM = 40;
const MAX_BPM = 220;

function clampBpm(value) {
  const bpm = Number(value);

  if (!Number.isFinite(bpm)) return 72;

  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));
}

export default function Metronome({ songBpm, songTitle, strummingPattern }) {
  const [bpm, setBpm] = useState(() => clampBpm(songBpm));
  const [isRunning, setIsRunning] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(1);

  const safeBpm = clampBpm(bpm);

  const playback = useStrummingPlayback({
    bpm: safeBpm,
    isRunning,
    pattern: strummingPattern,
  });

  useEffect(() => {
    setBpm(clampBpm(songBpm));
    setCurrentBeat(1);
    setIsRunning(false);
  }, [songBpm, songTitle]);

  useEffect(() => {
    if (!isRunning) {
      setCurrentBeat(1);
      return undefined;
    }

    const quarterNoteMs = Math.max(120, 60000 / safeBpm);

    const intervalId = window.setInterval(() => {
      setCurrentBeat((beat) => (beat >= 4 ? 1 : beat + 1));
    }, quarterNoteMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRunning, safeBpm]);

  function handleBpmChange(value) {
    if (value === "") {
      setBpm("");
      return;
    }

    setBpm(clampBpm(value));
  }

  function decreaseBpm() {
    setBpm((current) => clampBpm(clampBpm(current) - 1));
  }

  function increaseBpm() {
    setBpm((current) => clampBpm(clampBpm(current) + 1));
  }

  function toggleMetronome() {
    setIsRunning((running) => !running);
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
          <input type="number" min={MIN_BPM} max={MAX_BPM} value={bpm} onChange={(event) => handleBpmChange(event.target.value)} onBlur={() => setBpm(safeBpm)} />
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

      <button type="button" className={isRunning ? "metronome-stop-button" : "selected-button"} onClick={toggleMetronome}>
        {isRunning ? "Stop" : "Start"}
      </button>

      <StrummingPlaybackGuide activeSlot={playback.activeSlot} isRunning={isRunning} pattern={strummingPattern} slots={playback.slots} />

      <p className="metronome-note">Beat 1 is accented. The strumming guide advances through eighth-note slots while the metronome runs.</p>
    </section>
  );
}
