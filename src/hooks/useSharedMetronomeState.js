import * as React from "react";

const { useCallback, useEffect, useState } = React;

const MIN_BPM = 40;
const MAX_BPM = 220;
const DEFAULT_BPM = 72;

let audioContext = null;
let intervalId = null;
let startupTimeoutId = null;

let sharedMetronomeState = {
  bpm: DEFAULT_BPM,
  currentBeat: 1,
  isRunning: false,
  tickStartMs: 0,
};

let playbackSyncState = {
  bpm: DEFAULT_BPM,
  cycleStartMs: 0,
  isPlaying: false,
};

const subscribers = new Set();

function clampBpm(value) {
  const bpm = Number(value);

  if (!Number.isFinite(bpm)) return DEFAULT_BPM;

  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));
}

function getNowMs() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }

  return Date.now();
}

function emitMetronomeState() {
  subscribers.forEach((subscriber) => subscriber(sharedMetronomeState));
}

function setSharedMetronomeState(nextState) {
  sharedMetronomeState = {
    ...sharedMetronomeState,
    ...nextState,
  };

  emitMetronomeState();
}

function getAudioContextConstructor() {
  if (typeof window === "undefined") return null;

  return window.AudioContext || window.webkitAudioContext || null;
}

function getAudioContext() {
  if (typeof window === "undefined") return null;

  const AudioContextConstructor = getAudioContextConstructor();

  if (!AudioContextConstructor) return null;

  if (!audioContext) {
    audioContext = new AudioContextConstructor();
  }

  return audioContext;
}

async function resumeAudioContext() {
  const context = getAudioContext();

  if (!context) return null;

  if (context.state === "suspended") {
    await context.resume();
  }

  return context;
}

function clearMetronomeTimers() {
  if (intervalId && typeof window !== "undefined") {
    window.clearInterval(intervalId);
  }

  if (startupTimeoutId && typeof window !== "undefined") {
    window.clearTimeout(startupTimeoutId);
  }

  intervalId = null;
  startupTimeoutId = null;
}

function playTick(beat) {
  const context = audioContext;

  if (!context || context.state !== "running") return;

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  const isAccent = beat === 1;

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(isAccent ? 1120 : 760, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(isAccent ? 0.26 : 0.18, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.08);
}

function getNextBeat(beat) {
  return beat >= 4 ? 1 : beat + 1;
}

function startTickLoop(firstBeat, quarterNoteMs) {
  let activeBeat = firstBeat;

  setSharedMetronomeState({
    currentBeat: activeBeat,
    isRunning: true,
  });
  playTick(activeBeat);

  intervalId = window.setInterval(() => {
    activeBeat = getNextBeat(activeBeat);

    setSharedMetronomeState({
      currentBeat: activeBeat,
    });
    playTick(activeBeat);
  }, quarterNoteMs);
}

function scheduleMetronome(bpm, { firstBeat = 1, firstTickDelayMs = 0 } = {}) {
  if (typeof window === "undefined") return;

  clearMetronomeTimers();

  const safeBpm = clampBpm(bpm);
  const quarterNoteMs = Math.max(120, 60000 / safeBpm);
  const delay = Math.max(0, Math.round(firstTickDelayMs));
  const tickStartMs = getNowMs() + delay;

  setSharedMetronomeState({
    bpm: safeBpm,
    currentBeat: firstBeat,
    isRunning: true,
    tickStartMs,
  });

  if (delay <= 20) {
    startTickLoop(firstBeat, quarterNoteMs);
    return;
  }

  startupTimeoutId = window.setTimeout(() => {
    startupTimeoutId = null;
    startTickLoop(firstBeat, quarterNoteMs);
  }, delay);
}

function getPlaybackAlignedStart(bpm) {
  if (!playbackSyncState.isPlaying || !playbackSyncState.cycleStartMs) return null;

  const safeBpm = clampBpm(playbackSyncState.bpm || bpm);
  const beatMs = Math.max(120, 60000 / safeBpm);
  const now = getNowMs();
  const elapsedMs = Math.max(0, now - playbackSyncState.cycleStartMs);
  const nextBeatIndex = Math.floor(elapsedMs / beatMs) + 1;
  const nextBeatTimeMs = playbackSyncState.cycleStartMs + nextBeatIndex * beatMs;
  const firstTickDelayMs = Math.max(0, nextBeatTimeMs - now);
  const firstBeat = (nextBeatIndex % 4) + 1;

  return {
    bpm: safeBpm,
    firstBeat,
    firstTickDelayMs,
  };
}

export function registerSharedPlaybackClock({ bpm, cycleStartMs = getNowMs(), isPlaying = true } = {}) {
  playbackSyncState = {
    bpm: clampBpm(bpm || sharedMetronomeState.bpm),
    cycleStartMs,
    isPlaying: Boolean(isPlaying),
  };

  if (sharedMetronomeState.isRunning && playbackSyncState.isPlaying) {
    scheduleMetronome(playbackSyncState.bpm, {
      firstBeat: 1,
      firstTickDelayMs: 0,
    });
  }
}

export function clearSharedPlaybackClock() {
  playbackSyncState = {
    ...playbackSyncState,
    isPlaying: false,
  };
}

export async function startSharedMetronome({ bpm = sharedMetronomeState.bpm, syncToPlayback = true } = {}) {
  const safeBpm = clampBpm(bpm);
  const context = await resumeAudioContext();

  if (!context) return;

  const alignedStart = syncToPlayback ? getPlaybackAlignedStart(safeBpm) : null;

  if (alignedStart) {
    scheduleMetronome(alignedStart.bpm, alignedStart);
    return;
  }

  scheduleMetronome(safeBpm);
}

export function stopSharedMetronome() {
  clearMetronomeTimers();
  setSharedMetronomeState({
    currentBeat: 1,
    isRunning: false,
    tickStartMs: 0,
  });
}

export function setSharedMetronomeRunning(isRunning) {
  if (isRunning) {
    setSharedMetronomeState({
      currentBeat: 1,
      isRunning: true,
      tickStartMs: getNowMs(),
    });
    return;
  }

  stopSharedMetronome();
}

export async function toggleSharedMetronome({ bpm = sharedMetronomeState.bpm, syncToPlayback = true } = {}) {
  if (sharedMetronomeState.isRunning) {
    stopSharedMetronome();
    return;
  }

  await startSharedMetronome({ bpm, syncToPlayback });
}

export function setSharedMetronomeBpm(bpm) {
  const safeBpm = clampBpm(bpm);

  setSharedMetronomeState({
    bpm: safeBpm,
  });

  if (sharedMetronomeState.isRunning) {
    const alignedStart = getPlaybackAlignedStart(safeBpm);

    if (alignedStart) {
      scheduleMetronome(alignedStart.bpm, alignedStart);
      return;
    }

    scheduleMetronome(safeBpm);
  }
}

export function getSharedMetronomeState() {
  return sharedMetronomeState;
}

export default function useSharedMetronomeState() {
  const [state, setState] = useState(() => getSharedMetronomeState());

  useEffect(() => {
    subscribers.add(setState);

    return () => {
      subscribers.delete(setState);
    };
  }, []);

  const setMetronomeBpm = useCallback((bpm) => {
    setSharedMetronomeBpm(bpm);
  }, []);

  const startMetronome = useCallback(async ({ bpm, syncToPlayback } = {}) => {
    await startSharedMetronome({ bpm, syncToPlayback });
  }, []);

  const stopMetronome = useCallback(() => {
    stopSharedMetronome();
  }, []);

  const toggleMetronomeRunning = useCallback(async ({ bpm, syncToPlayback } = {}) => {
    await toggleSharedMetronome({ bpm, syncToPlayback });
  }, []);

  return {
    currentBeat: state.currentBeat,
    isMetronomeRunning: state.isRunning,
    metronomeBpm: state.bpm,
    metronomeStartAtMs: state.tickStartMs,
    setMetronomeBpm,
    startMetronome,
    stopMetronome,
    toggleMetronomeRunning,
  };
}
