import * as React from "react";
import { clearSharedPlaybackClock, registerSharedPlaybackClock } from "./useSharedMetronomeState";
import useTempoOverride, { getEffectiveSongBpm } from "./useTempoOverride";
import { createPlaythroughSteps, getChordFrequencies, getSafePlaybackBpm } from "../utils/songPlaythroughUtils";

const { useCallback, useEffect, useState } = React;

const DEFAULT_BEATS_PER_CHORD = 2;
const MELODY_MODE = "melody";
const BACKING_MODE = "backing";

let audioContext = null;
let playbackCycleId = 0;
let timeoutIds = [];

const transportSubscribers = new Set();

let transportState = {
  activeStepIndex: -1,
  backingMode: BACKING_MODE,
  beatsPerChord: DEFAULT_BEATS_PER_CHORD,
  currentSongId: null,
  hasSteps: false,
  isLooping: false,
  isPlaying: false,
  melodyMode: MELODY_MODE,
  playbackMode: MELODY_MODE,
  safeBpm: 72,
  sectionCount: 0,
  statusMessage: "",
  stepDurationMs: Math.round((60 / 72) * DEFAULT_BEATS_PER_CHORD * 1000),
  steps: [],
};

function getNowMs() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }

  return Date.now();
}

function getAudioContextConstructor() {
  if (typeof window === "undefined") return null;

  return window.AudioContext || window.webkitAudioContext || null;
}

function getOrCreateAudioContext() {
  if (audioContext) return audioContext;

  const AudioContextConstructor = getAudioContextConstructor();

  if (!AudioContextConstructor) return null;

  audioContext = new AudioContextConstructor();

  return audioContext;
}

function emitTransportState() {
  transportSubscribers.forEach((subscriber) => subscriber(transportState));
}

function setTransportState(nextState) {
  transportState = {
    ...transportState,
    ...nextState,
  };

  emitTransportState();
}

function clearPlaybackTimers() {
  timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
  timeoutIds = [];
  playbackCycleId += 1;
}

function getSongTransportState({ beatsPerChord = DEFAULT_BEATS_PER_CHORD, bpm, selectedSong }) {
  const steps = createPlaythroughSteps(selectedSong);
  const safeBpm = getSafePlaybackBpm(bpm ?? getEffectiveSongBpm(selectedSong));
  const stepDurationMs = Math.max(350, Math.round((60 / safeBpm) * beatsPerChord * 1000));
  const sectionCount = new Set(steps.map((step) => step.sectionName)).size;

  return {
    beatsPerChord,
    currentSongId: selectedSong?.id || null,
    hasSteps: steps.length > 0,
    safeBpm,
    sectionCount,
    stepDurationMs,
    steps,
  };
}

function playSynthMelodyOverlay(context, frequencies, startTime, durationSeconds) {
  const melodyFrequency = (frequencies[1] || frequencies[0] || 220) * 2;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  const melodyStartTime = startTime + 0.08;
  const melodyStopTime = melodyStartTime + Math.max(0.16, durationSeconds * 0.48);

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(melodyFrequency, melodyStartTime);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2400, melodyStartTime);

  gain.gain.setValueAtTime(0.0001, melodyStartTime);
  gain.gain.exponentialRampToValueAtTime(0.055, melodyStartTime + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, melodyStopTime);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);

  oscillator.start(melodyStartTime);
  oscillator.stop(melodyStopTime + 0.04);
}

function playSyntheticChord(context, chord, durationSeconds, mode = MELODY_MODE) {
  if (!context) return;

  const frequencies = getChordFrequencies(chord);

  if (!frequencies.length) return;

  const startTime = context.currentTime + 0.025;
  const stopTime = startTime + durationSeconds;
  const masterGain = context.createGain();
  const lowPassFilter = context.createBiquadFilter();

  lowPassFilter.type = "lowpass";
  lowPassFilter.frequency.setValueAtTime(mode === BACKING_MODE ? 1500 : 1800, startTime);
  lowPassFilter.Q.setValueAtTime(0.7, startTime);
  masterGain.gain.setValueAtTime(0.0001, startTime);
  masterGain.gain.exponentialRampToValueAtTime(mode === BACKING_MODE ? 0.1 : 0.12, startTime + 0.025);
  masterGain.gain.exponentialRampToValueAtTime(0.045, startTime + Math.min(0.22, durationSeconds * 0.35));
  masterGain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

  masterGain.connect(lowPassFilter);
  lowPassFilter.connect(context.destination);

  frequencies.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const noteGain = context.createGain();
    const noteStartTime = startTime + index * 0.012;
    const noteStopTime = stopTime + 0.035;

    oscillator.type = index === 0 ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(frequency, noteStartTime);
    oscillator.detune.setValueAtTime(index % 2 === 0 ? -4 : 4, noteStartTime);

    noteGain.gain.setValueAtTime(0.0001, noteStartTime);
    noteGain.gain.exponentialRampToValueAtTime(1 / Math.max(2.5, frequencies.length), noteStartTime + 0.018);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

    oscillator.connect(noteGain);
    noteGain.connect(masterGain);
    oscillator.start(noteStartTime);
    oscillator.stop(noteStopTime);
  });

  if (mode === MELODY_MODE) {
    playSynthMelodyOverlay(context, frequencies, startTime, durationSeconds);
  }
}

function stopTransportPlayback({ message = "" } = {}) {
  clearPlaybackTimers();
  clearSharedPlaybackClock();
  setTransportState({
    activeStepIndex: -1,
    isPlaying: false,
    statusMessage: message,
  });
}

function schedulePlaybackCycle(context, mode = transportState.playbackMode) {
  const cycleId = playbackCycleId + 1;
  const cycleStartMs = getNowMs();
  const stepDurationSeconds = transportState.stepDurationMs / 1000;

  playbackCycleId = cycleId;
  timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
  timeoutIds = [];

  registerSharedPlaybackClock({
    bpm: transportState.safeBpm,
    cycleStartMs,
    isPlaying: true,
  });

  setTransportState({
    activeStepIndex: -1,
    isPlaying: true,
    playbackMode: mode,
    statusMessage: `${transportState.isLooping ? "Looping" : "Playing"} ${mode === BACKING_MODE ? "backing track" : "melody guide"} at ${transportState.safeBpm} BPM.`,
  });

  transportState.steps.forEach((step, stepIndex) => {
    const timeoutId = window.setTimeout(() => {
      if (cycleId !== playbackCycleId) return;

      setTransportState({
        activeStepIndex: stepIndex,
      });
      playSyntheticChord(context, step.chord, stepDurationSeconds * 0.88, mode);
    }, stepIndex * transportState.stepDurationMs);

    timeoutIds.push(timeoutId);
  });

  const completionTimeoutId = window.setTimeout(() => {
    if (cycleId !== playbackCycleId) return;

    if (transportState.isLooping) {
      schedulePlaybackCycle(context, mode);
      return;
    }

    stopTransportPlayback({ message: "Playthrough preview complete." });
  }, transportState.steps.length * transportState.stepDurationMs + 80);

  timeoutIds.push(completionTimeoutId);
}

function updateTransportSong({ beatsPerChord = DEFAULT_BEATS_PER_CHORD, bpm, selectedSong }) {
  if (!selectedSong) return;

  const nextSongState = getSongTransportState({
    beatsPerChord,
    bpm,
    selectedSong,
  });

  const songChanged = Boolean(transportState.currentSongId && transportState.currentSongId !== nextSongState.currentSongId);
  const bpmChanged = transportState.currentSongId === nextSongState.currentSongId && transportState.safeBpm !== nextSongState.safeBpm;

  if (transportState.isPlaying && songChanged) {
    stopTransportPlayback({ message: "Playthrough stopped because the selected song changed." });
  }

  setTransportState({
    ...nextSongState,
    activeStepIndex: transportState.isPlaying && !songChanged ? transportState.activeStepIndex : -1,
  });

  if (transportState.isPlaying && !songChanged && bpmChanged && audioContext) {
    schedulePlaybackCycle(audioContext, transportState.playbackMode);
  }
}

function startTransportPlayback({ beatsPerChord = DEFAULT_BEATS_PER_CHORD, bpm, mode = MELODY_MODE, selectedSong }) {
  const nextSongState = getSongTransportState({
    beatsPerChord,
    bpm,
    selectedSong,
  });

  if (!nextSongState.hasSteps) {
    setTransportState({
      ...nextSongState,
      statusMessage: "Add song sections before using Playthrough Preview.",
    });
    return;
  }

  const context = getOrCreateAudioContext();

  if (!context) {
    setTransportState({
      ...nextSongState,
      statusMessage: "Audio playback is not available in this browser.",
    });
    return;
  }

  if (context.state === "suspended") {
    void context.resume();
  }

  setTransportState({
    ...nextSongState,
  });
  schedulePlaybackCycle(context, mode);
}

function toggleTransportLoop() {
  setTransportState({
    isLooping: !transportState.isLooping,
  });
}

export default function useSongPlaythroughPlayback({ beatsPerChord = DEFAULT_BEATS_PER_CHORD, bpmOverride = null, selectedSong }) {
  const tempo = useTempoOverride(selectedSong);
  const effectiveBpm = bpmOverride ?? tempo.effectiveBpm;
  const [state, setState] = useState(() => transportState);

  useEffect(() => {
    transportSubscribers.add(setState);

    return () => {
      transportSubscribers.delete(setState);
    };
  }, []);

  useEffect(() => {
    updateTransportSong({
      beatsPerChord,
      bpm: effectiveBpm,
      selectedSong,
    });
  }, [beatsPerChord, effectiveBpm, selectedSong]);

  const startPlayback = useCallback(
    ({ mode = MELODY_MODE } = {}) => {
      startTransportPlayback({
        beatsPerChord,
        bpm: effectiveBpm,
        mode,
        selectedSong,
      });
    },
    [beatsPerChord, effectiveBpm, selectedSong],
  );

  const stopPlayback = useCallback((options = {}) => {
    stopTransportPlayback(options);
  }, []);

  const toggleLoop = useCallback(() => {
    toggleTransportLoop();
  }, []);

  const activeStep = state.steps[state.activeStepIndex] || null;

  return {
    activeStep,
    activeStepIndex: state.activeStepIndex,
    backingMode: BACKING_MODE,
    beatsPerChord,
    hasSteps: state.hasSteps,
    isLooping: state.isLooping,
    isPlaying: state.isPlaying,
    melodyMode: MELODY_MODE,
    playbackMode: state.playbackMode,
    safeBpm: state.safeBpm,
    sectionCount: state.sectionCount,
    startPlayback,
    statusMessage: state.statusMessage,
    stepDurationMs: state.stepDurationMs,
    steps: state.steps,
    stopPlayback,
    toggleLoop,
  };
}
