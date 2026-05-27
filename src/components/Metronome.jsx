import * as React from "react";

const { useEffect, useRef, useState } = React;

const BEATS_PER_MEASURE = 4;
const MIN_BPM = 40;
const MAX_BPM = 220;

function clampBpm(value) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) return 80;

  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(numericValue)));
}

export default function Metronome({ songBpm, songTitle }) {
  const [bpm, setBpm] = useState(() => clampBpm(songBpm || 80));
  const [isRunning, setIsRunning] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(1);

  const audioContextRef = useRef(null);
  const beatRef = useRef(1);

  useEffect(() => {
    setIsRunning(false);
    setCurrentBeat(1);
    beatRef.current = 1;
    setBpm(clampBpm(songBpm || 80));
  }, [songBpm, songTitle]);

  useEffect(() => {
    if (!isRunning) return undefined;

    beatRef.current = 1;
    setCurrentBeat(1);
    playClick(true);

    const intervalId = window.setInterval(() => {
      const nextBeat = beatRef.current >= BEATS_PER_MEASURE ? 1 : beatRef.current + 1;

      beatRef.current = nextBeat;
      setCurrentBeat(nextBeat);
      playClick(nextBeat === 1);
    }, 60000 / bpm);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRunning, bpm]);

  useEffect(() => {
    if (isRunning) return;

    beatRef.current = 1;
    setCurrentBeat(1);
  }, [isRunning]);

  function getAudioContext() {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextConstructor) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextConstructor();
    }

    return audioContextRef.current;
  }

  async function prepareAudioContext() {
    const audioContext = getAudioContext();

    if (!audioContext) return null;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    return audioContext;
  }

  function playClick(isAccent) {
    const audioContext = getAudioContext();

    if (!audioContext) return;

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = isAccent ? 1200 : 820;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(isAccent ? 0.38 : 0.22, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.09);
  }

  async function toggleMetronome() {
    if (isRunning) {
      setIsRunning(false);
      return;
    }

    await prepareAudioContext();
    setIsRunning(true);
  }

  function decreaseBpm() {
    setBpm((currentBpm) => clampBpm(currentBpm - 1));
  }

  function increaseBpm() {
    setBpm((currentBpm) => clampBpm(currentBpm + 1));
  }

  function handleBpmInputChange(event) {
    setBpm(clampBpm(event.target.value));
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
        <button type="button" className="ghost-button bpm-button" onClick={decreaseBpm}>
          −
        </button>

        <label className="bpm-input-wrap">
          <span>BPM</span>
          <input type="number" min={MIN_BPM} max={MAX_BPM} value={bpm} onChange={handleBpmInputChange} />
        </label>

        <button type="button" className="ghost-button bpm-button" onClick={increaseBpm}>
          +
        </button>
      </div>

      <div className="beat-dots" aria-label={`Beat ${currentBeat} of ${BEATS_PER_MEASURE}`}>
        {Array.from({ length: BEATS_PER_MEASURE }, (_, index) => {
          const beat = index + 1;

          return <span key={beat} className={`beat-dot ${currentBeat === beat && isRunning ? "is-active" : ""} ${beat === 1 ? "is-accent" : ""}`} />;
        })}
      </div>

      <button type="button" className={isRunning ? "metronome-stop-button" : "selected-button"} onClick={toggleMetronome}>
        {isRunning ? "Stop" : "Start"}
      </button>

      <p className="metronome-note">Beat 1 is accented. The metronome resets when you change songs.</p>
    </section>
  );
}
