import * as React from "react";
import { clearSharedPlaybackClock, registerSharedPlaybackClock } from "./useSharedMetronomeState";
import useTempoOverride, { getEffectiveSongBpm } from "./useTempoOverride";
import { createPlaythroughSteps, getChordFrequencies, getSafePlaybackBpm } from "../utils/songPlaythroughUtils";

const { useCallback, useEffect, useState } = React;

const DEFAULT_BEATS_PER_CHORD = 2;
const MELODY_MODE = "melody";
const BACKING_MODE = "backing";
const MIN_GAIN = 0.0001;

let audioContext = null;
let audioBus = null;
let playbackCycleId = 0;
let timeoutIds = [];

const activeAudioStops = new Set();
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

function getAudioBus(context) {
  if (audioBus?.context === context) return audioBus;

  const compressor = context.createDynamicsCompressor();
  const roomDelay = context.createDelay(1);
  const feedbackGain = context.createGain();
  const wetGain = context.createGain();
  const masterGain = context.createGain();

  compressor.threshold.setValueAtTime(-26, context.currentTime);
  compressor.knee.setValueAtTime(18, context.currentTime);
  compressor.ratio.setValueAtTime(5, context.currentTime);
  compressor.attack.setValueAtTime(0.008, context.currentTime);
  compressor.release.setValueAtTime(0.18, context.currentTime);

  roomDelay.delayTime.setValueAtTime(0.095, context.currentTime);
  feedbackGain.gain.setValueAtTime(0.17, context.currentTime);
  wetGain.gain.setValueAtTime(0.11, context.currentTime);
  masterGain.gain.setValueAtTime(0.82, context.currentTime);

  compressor.connect(masterGain);
  compressor.connect(roomDelay);
  roomDelay.connect(feedbackGain);
  feedbackGain.connect(roomDelay);
  roomDelay.connect(wetGain);
  wetGain.connect(masterGain);
  masterGain.connect(context.destination);

  audioBus = {
    context,
    input: compressor,
  };

  return audioBus;
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

function registerAudioStop(stopCallback, lifetimeMs) {
  activeAudioStops.add(stopCallback);

  window.setTimeout(() => {
    activeAudioStops.delete(stopCallback);
  }, Math.max(250, lifetimeMs));
}

function stopActiveAudioNodes() {
  const callbacks = Array.from(activeAudioStops);

  activeAudioStops.clear();

  callbacks.forEach((stopCallback) => {
    try {
      stopCallback();
    } catch {
      // Nodes may already be stopped by their scheduled envelope.
    }
  });
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

function getChordToneConfig(mode) {
  if (mode === BACKING_MODE) {
    return {
      detuneCents: 3,
      filterFrequency: 1320,
      masterPeak: 0.092,
      oscillatorTypes: ["triangle", "sine", "sine", "triangle"],
      releaseTailSeconds: 0.72,
      sustainGain: 0.034,
    };
  }

  return {
    detuneCents: 4,
    filterFrequency: 1650,
    masterPeak: 0.105,
    oscillatorTypes: ["triangle", "sine", "sine", "triangle"],
    releaseTailSeconds: 0.58,
    sustainGain: 0.04,
  };
}

function setSmoothEnvelope(gainParam, startTime, peakGain, sustainGain, releaseStartTime, stopTime) {
  gainParam.setValueAtTime(MIN_GAIN, startTime);
  gainParam.exponentialRampToValueAtTime(peakGain, startTime + 0.035);
  gainParam.exponentialRampToValueAtTime(sustainGain, startTime + 0.22);
  gainParam.setTargetAtTime(MIN_GAIN, releaseStartTime, Math.max(0.055, (stopTime - releaseStartTime) / 4));
  gainParam.exponentialRampToValueAtTime(MIN_GAIN, stopTime);
}

function playSynthMelodyOverlay(context, frequencies, startTime, durationSeconds) {
  const melodyFrequency = (frequencies[1] || frequencies[0] || 220) * 2;
  const oscillator = context.createOscillator();
  const vibrato = context.createOscillator();
  const vibratoGain = context.createGain();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  const bus = getAudioBus(context);
  const melodyStartTime = startTime + 0.08;
  const melodyReleaseStartTime = melodyStartTime + Math.max(0.18, durationSeconds * 0.62);
  const melodyStopTime = melodyReleaseStartTime + 0.28;

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(melodyFrequency, melodyStartTime);

  vibrato.type = "sine";
  vibrato.frequency.setValueAtTime(5.2, melodyStartTime);
  vibratoGain.gain.setValueAtTime(5.5, melodyStartTime);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2850, melodyStartTime);
  filter.Q.setValueAtTime(0.85, melodyStartTime);

  gain.gain.setValueAtTime(MIN_GAIN, melodyStartTime);
  gain.gain.exponentialRampToValueAtTime(0.047, melodyStartTime + 0.032);
  gain.gain.setTargetAtTime(0.026, melodyStartTime + 0.16, 0.18);
  gain.gain.setTargetAtTime(MIN_GAIN, melodyReleaseStartTime, 0.085);
  gain.gain.exponentialRampToValueAtTime(MIN_GAIN, melodyStopTime);

  vibrato.connect(vibratoGain);
  vibratoGain.connect(oscillator.frequency);
  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(bus.input);

  oscillator.start(melodyStartTime);
  vibrato.start(melodyStartTime);
  oscillator.stop(melodyStopTime + 0.06);
  vibrato.stop(melodyStopTime + 0.06);

  registerAudioStop(() => {
    const now = context.currentTime;

    gain.gain.cancelScheduledValues(now);
    gain.gain.setTargetAtTime(MIN_GAIN, now, 0.025);
    oscillator.stop(now + 0.08);
    vibrato.stop(now + 0.08);
  }, (melodyStopTime - context.currentTime + 0.2) * 1000);
}

function playSyntheticChord(context, chord, durationSeconds, mode = MELODY_MODE) {
  if (!context) return;

  const frequencies = getChordFrequencies(chord);

  if (!frequencies.length) return;

  const config = getChordToneConfig(mode);
  const startTime = context.currentTime + 0.025;
  const releaseStartTime = startTime + durationSeconds;
  const stopTime = releaseStartTime + Math.min(config.releaseTailSeconds, Math.max(0.28, durationSeconds * 0.52));
  const masterGain = context.createGain();
  const lowPassFilter = context.createBiquadFilter();
  const bus = getAudioBus(context);
  const oscillators = [];

  lowPassFilter.type = "lowpass";
  lowPassFilter.frequency.setValueAtTime(config.filterFrequency, startTime);
  lowPassFilter.Q.setValueAtTime(0.78, startTime);

  setSmoothEnvelope(masterGain.gain, startTime, config.masterPeak, config.sustainGain, releaseStartTime, stopTime);

  masterGain.connect(lowPassFilter);
  lowPassFilter.connect(bus.input);

  frequencies.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const noteGain = context.createGain();
    const noteStartTime = startTime + index * 0.014;
    const noteStopTime = stopTime + 0.08;
    const oscillatorType = config.oscillatorTypes[index % config.oscillatorTypes.length];

    oscillator.type = oscillatorType;
    oscillator.frequency.setValueAtTime(frequency, noteStartTime);
    oscillator.detune.setValueAtTime(index % 2 === 0 ? -config.detuneCents : config.detuneCents, noteStartTime);

    noteGain.gain.setValueAtTime(MIN_GAIN, noteStartTime);
    noteGain.gain.exponentialRampToValueAtTime(1 / Math.max(2.8, frequencies.length), noteStartTime + 0.024);
    noteGain.gain.setTargetAtTime(MIN_GAIN, releaseStartTime, 0.16);
    noteGain.gain.exponentialRampToValueAtTime(MIN_GAIN, stopTime);

    oscillator.connect(noteGain);
    noteGain.connect(masterGain);
    oscillator.start(noteStartTime);
    oscillator.stop(noteStopTime);
    oscillators.push(oscillator);
  });

  if (mode === MELODY_MODE) {
    playSynthMelodyOverlay(context, frequencies, startTime, durationSeconds);
  }

  registerAudioStop(() => {
    const now = context.currentTime;

    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setTargetAtTime(MIN_GAIN, now, 0.03);

    oscillators.forEach((oscillator) => {
      oscillator.stop(now + 0.08);
    });
  }, (stopTime - context.currentTime + 0.25) * 1000);
}

function stopTransportPlayback({ message = "" } = {}) {
  clearPlaybackTimers();
  clearSharedPlaybackClock();
  stopActiveAudioNodes();
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
      playSyntheticChord(context, step.chord, stepDurationSeconds * 0.92, mode);
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
  }, transportState.steps.length * transportState.stepDurationMs + 120);

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
