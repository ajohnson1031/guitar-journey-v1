import * as React from "react";
import { clearSharedPlaybackClock, registerSharedPlaybackClock } from "./useSharedMetronomeState";
import { createPlaythroughSteps, getChordFrequencies, getSafePlaybackBpm } from "../utils/songPlaythroughUtils";

const { useCallback, useEffect, useMemo, useRef, useState } = React;

const DEFAULT_BEATS_PER_CHORD = 2;
const MELODY_MODE = "melody";
const BACKING_MODE = "backing";

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

function getOrCreateAudioContext(audioContextRef) {
  if (audioContextRef.current) return audioContextRef.current;

  const AudioContextConstructor = getAudioContextConstructor();

  if (!AudioContextConstructor) return null;

  audioContextRef.current = new AudioContextConstructor();

  return audioContextRef.current;
}

function playSynthMelodyOverlay(audioContext, frequencies, startTime, durationSeconds) {
  const melodyFrequency = (frequencies[1] || frequencies[0] || 220) * 2;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
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
  gain.connect(audioContext.destination);

  oscillator.start(melodyStartTime);
  oscillator.stop(melodyStopTime + 0.04);
}

function playSyntheticChord(audioContext, chord, durationSeconds, mode = MELODY_MODE) {
  if (!audioContext) return;

  const frequencies = getChordFrequencies(chord);

  if (!frequencies.length) return;

  const startTime = audioContext.currentTime + 0.025;
  const stopTime = startTime + durationSeconds;
  const masterGain = audioContext.createGain();
  const lowPassFilter = audioContext.createBiquadFilter();

  lowPassFilter.type = "lowpass";
  lowPassFilter.frequency.setValueAtTime(mode === BACKING_MODE ? 1500 : 1800, startTime);
  lowPassFilter.Q.setValueAtTime(0.7, startTime);
  masterGain.gain.setValueAtTime(0.0001, startTime);
  masterGain.gain.exponentialRampToValueAtTime(mode === BACKING_MODE ? 0.1 : 0.12, startTime + 0.025);
  masterGain.gain.exponentialRampToValueAtTime(0.045, startTime + Math.min(0.22, durationSeconds * 0.35));
  masterGain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

  masterGain.connect(lowPassFilter);
  lowPassFilter.connect(audioContext.destination);

  frequencies.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const noteGain = audioContext.createGain();
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
    playSynthMelodyOverlay(audioContext, frequencies, startTime, durationSeconds);
  }
}

export default function useSongPlaythroughPlayback({ beatsPerChord = DEFAULT_BEATS_PER_CHORD, selectedSong }) {
  const audioContextRef = useRef(null);
  const isLoopingRef = useRef(false);
  const playbackModeRef = useRef(MELODY_MODE);
  const timeoutIdsRef = useRef([]);
  const steps = useMemo(() => createPlaythroughSteps(selectedSong), [selectedSong]);
  const safeBpm = getSafePlaybackBpm(selectedSong?.bpm);
  const stepDurationMs = Math.max(350, Math.round((60 / safeBpm) * beatsPerChord * 1000));
  const stepDurationSeconds = stepDurationMs / 1000;
  const sectionCount = new Set(steps.map((step) => step.sectionName)).size;
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [isLooping, setIsLooping] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackMode, setPlaybackMode] = useState(MELODY_MODE);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  useEffect(() => {
    playbackModeRef.current = playbackMode;
  }, [playbackMode]);

  const clearPlaybackTimers = useCallback(() => {
    timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutIdsRef.current = [];
  }, []);

  const stopPlayback = useCallback(
    ({ message = "" } = {}) => {
      clearPlaybackTimers();
      clearSharedPlaybackClock();
      setActiveStepIndex(-1);
      setIsPlaying(false);
      setStatusMessage(message);
    },
    [clearPlaybackTimers],
  );

  const schedulePlaybackCycle = useCallback(
    (audioContext, mode = playbackModeRef.current) => {
      const cycleStartMs = getNowMs();

      clearPlaybackTimers();
      registerSharedPlaybackClock({
        bpm: safeBpm,
        cycleStartMs,
        isPlaying: true,
      });
      setIsPlaying(true);
      setPlaybackMode(mode);
      setStatusMessage(`${isLoopingRef.current ? "Looping" : "Playing"} ${mode === BACKING_MODE ? "backing track" : "melody guide"} at ${safeBpm} BPM.`);

      steps.forEach((step, stepIndex) => {
        const timeoutId = window.setTimeout(() => {
          setActiveStepIndex(stepIndex);
          playSyntheticChord(audioContext, step.chord, stepDurationSeconds * 0.88, mode);
        }, stepIndex * stepDurationMs);

        timeoutIdsRef.current.push(timeoutId);
      });

      const completionTimeoutId = window.setTimeout(() => {
        if (isLoopingRef.current) {
          schedulePlaybackCycle(audioContext, mode);
          return;
        }

        stopPlayback({ message: "Playthrough preview complete." });
      }, steps.length * stepDurationMs + 80);

      timeoutIdsRef.current.push(completionTimeoutId);
    },
    [clearPlaybackTimers, safeBpm, stepDurationMs, stepDurationSeconds, steps, stopPlayback],
  );

  const startPlayback = useCallback(
    ({ mode = MELODY_MODE } = {}) => {
      if (!steps.length) {
        setStatusMessage("Add song sections before using Playthrough Preview.");
        return;
      }

      const audioContext = getOrCreateAudioContext(audioContextRef);

      if (!audioContext) {
        setStatusMessage("Audio playback is not available in this browser.");
        return;
      }

      if (audioContext.state === "suspended") {
        void audioContext.resume();
      }

      schedulePlaybackCycle(audioContext, mode);
    },
    [schedulePlaybackCycle, steps.length],
  );

  const toggleLoop = useCallback(() => {
    setIsLooping((currentValue) => !currentValue);
  }, []);

  useEffect(() => {
    stopPlayback();
  }, [selectedSong?.id, stopPlayback]);

  useEffect(() => {
    return () => {
      clearPlaybackTimers();
      clearSharedPlaybackClock();
    };
  }, [clearPlaybackTimers]);

  const activeStep = steps[activeStepIndex] || null;

  return {
    activeStep,
    activeStepIndex,
    backingMode: BACKING_MODE,
    beatsPerChord,
    hasSteps: steps.length > 0,
    isLooping,
    isPlaying,
    melodyMode: MELODY_MODE,
    playbackMode,
    safeBpm,
    sectionCount,
    startPlayback,
    statusMessage,
    stepDurationMs,
    steps,
    stopPlayback,
    toggleLoop,
  };
}
