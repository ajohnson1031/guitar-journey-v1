import * as React from "react";
import useStrummingPlayback from "../hooks/useStrummingPlayback";
import StrummingPlaybackGuide from "./StrummingPlaybackGuide";

const { useEffect, useRef, useState } = React;

const MIN_BPM = 40;
const MAX_BPM = 220;
const DEFAULT_BPM = 72;

function clampBpm(value) {
  const bpm = Number(value);

  if (!Number.isFinite(bpm)) return DEFAULT_BPM;

  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));
}

function getAudioContextConstructor() {
  return window.AudioContext || window.webkitAudioContext;
}

export default function Metronome({ songBpm, songTitle, strummingPattern }) {
  const [bpmInput, setBpmInput] = useState(() => String(clampBpm(songBpm)));
  const [isRunning, setIsRunning] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(1);
  const audioContextRef = useRef(null);

  const safeBpm = clampBpm(bpmInput);

  const playback = useStrummingPlayback({
    bpm: safeBpm,
    isRunning,
    pattern: strummingPattern,
  });

  function getAudioContext() {
    if (typeof window === "undefined") return null;

    const AudioContextConstructor = getAudioContextConstructor();

    if (!AudioContextConstructor) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextConstructor();
    }

    return audioContextRef.current;
  }

  async function resumeAudioContext() {
    const audioContext = getAudioContext();

    if (!audioContext) return null;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    return audioContext;
  }

  function playTick(beat) {
    const audioContext = audioContextRef.current;

    if (!audioContext || audioContext.state !== "running") return;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    const isAccent = beat === 1;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(isAccent ? 1120 : 760, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(isAccent ? 0.22 : 0.14, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.06);
  }

  useEffect(() => {
    setBpmInput(String(clampBpm(songBpm)));
    setCurrentBeat(1);
    setIsRunning(false);
  }, [songBpm, songTitle]);

  useEffect(() => {
    if (!isRunning) {
      setCurrentBeat(1);
      return undefined;
    }

    const quarterNoteMs = Math.max(120, 60000 / safeBpm);

    playTick(1);

    const intervalId = window.setInterval(() => {
      setCurrentBeat((beat) => {
        const nextBeat = beat >= 4 ? 1 : beat + 1;

        playTick(nextBeat);

        return nextBeat;
      });
    }, quarterNoteMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRunning, safeBpm]);

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

    if (!isRunning) {
      await resumeAudioContext();
    }

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

      <button type="button" className={isRunning ? "metronome-stop-button" : "selected-button"} onClick={toggleMetronome}>
        {isRunning ? "Stop" : "Start"}
      </button>

      <StrummingPlaybackGuide activeSlot={playback.activeSlot} isRunning={isRunning} slots={playback.slots} />

      <p className="metronome-note">Beat 1 is accented. The strumming guide advances through the selected strumming subdivision while the metronome runs.</p>
    </section>
  );
}
