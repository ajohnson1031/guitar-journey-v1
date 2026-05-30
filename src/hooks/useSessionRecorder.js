import * as React from "react";
import {
  createAudioRecorder,
  isAudioRecordingSupported,
  pauseMediaRecorder,
  requestAudioRecordingStream,
  resumeMediaRecorder,
  stopMediaStreamTracks,
} from "../utils/audioRecordingUtils";
import {
  getAudioContextConstructor,
  getMicrophoneLevelFromTimeDomainData,
  normalizeMicrophoneLevel,
} from "../utils/microphoneTestUtils";
import { formatRecordingDuration } from "../utils/recordingStorageUtils";
import { getAudioInputConstraints } from "../utils/settingsStorageUtils";

const { useCallback, useEffect, useRef, useState } = React;

const RECORDING_LEVEL_DECAY = 0.68;

function getRecordingElapsedSeconds(accumulatedMilliseconds, activeStartedAt) {
  const activeMilliseconds = activeStartedAt ? Date.now() - activeStartedAt : 0;

  return Math.max(0, Math.floor((accumulatedMilliseconds + activeMilliseconds) / 1000));
}

export default function useSessionRecorder({ audioInputSettings } = {}) {
  const [isSessionRecording, setIsSessionRecording] = useState(false);
  const [isSessionRecordingPaused, setIsSessionRecordingPaused] = useState(false);
  const [recordingDurationSeconds, setRecordingDurationSeconds] = useState(0);
  const [recordingInputLevel, setRecordingInputLevel] = useState(0);
  const [recordingMessage, setRecordingMessage] = useState("");
  const [pendingRecording, setPendingRecording] = useState(null);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const activeStartedAtRef = useRef(null);
  const accumulatedMillisecondsRef = useRef(0);
  const durationTimerRef = useRef(null);

  const inputMonitorAudioContextRef = useRef(null);
  const inputMonitorFrameRef = useRef(null);
  const inputMonitorSourceRef = useRef(null);
  const inputMonitorStreamRef = useRef(null);
  const displayedInputLevelRef = useRef(0);

  const clearDurationTimer = useCallback(() => {
    if (durationTimerRef.current) {
      window.clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

  const clearInputMonitorFrame = useCallback(() => {
    if (inputMonitorFrameRef.current) {
      window.cancelAnimationFrame(inputMonitorFrameRef.current);
      inputMonitorFrameRef.current = null;
    }
  }, []);

  const cleanupInputMonitorGraph = useCallback(() => {
    clearInputMonitorFrame();

    if (inputMonitorSourceRef.current) {
      try {
        inputMonitorSourceRef.current.disconnect();
      } catch {
        // Source may already be disconnected.
      }

      inputMonitorSourceRef.current = null;
    }

    if (inputMonitorAudioContextRef.current && inputMonitorAudioContextRef.current.state !== "closed") {
      void inputMonitorAudioContextRef.current.close();
    }

    inputMonitorAudioContextRef.current = null;
    displayedInputLevelRef.current = 0;
    setRecordingInputLevel(0);
  }, [clearInputMonitorFrame]);

  const stopInputMonitoring = useCallback(() => {
    cleanupInputMonitorGraph();
    stopMediaStreamTracks(inputMonitorStreamRef.current);
    inputMonitorStreamRef.current = null;
  }, [cleanupInputMonitorGraph]);

  const connectInputMonitor = useCallback(
    async (stream) => {
      cleanupInputMonitorGraph();

      const AudioContextConstructor = getAudioContextConstructor();

      if (!stream || !AudioContextConstructor) return false;

      try {
        const audioContext = new AudioContextConstructor();

        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }

        const analyser = audioContext.createAnalyser();

        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.35;

        const source = audioContext.createMediaStreamSource(stream);
        const dataArray = new Uint8Array(analyser.fftSize);

        dataArray.fill(128);
        source.connect(analyser);

        inputMonitorAudioContextRef.current = audioContext;
        inputMonitorSourceRef.current = source;
        displayedInputLevelRef.current = 0;

        function readInputLevel() {
          analyser.getByteTimeDomainData(dataArray);

          const rawLevel = getMicrophoneLevelFromTimeDomainData(dataArray);
          const decayedLevel = displayedInputLevelRef.current * RECORDING_LEVEL_DECAY;
          const nextLevel = normalizeMicrophoneLevel(Math.max(rawLevel, decayedLevel));

          displayedInputLevelRef.current = nextLevel;
          setRecordingInputLevel(nextLevel);

          inputMonitorFrameRef.current = window.requestAnimationFrame(readInputLevel);
        }

        readInputLevel();

        return true;
      } catch {
        cleanupInputMonitorGraph();

        return false;
      }
    },
    [cleanupInputMonitorGraph],
  );

  const startInputMonitoring = useCallback(async () => {
    if (inputMonitorStreamRef.current) return true;

    try {
      const stream = await requestAudioRecordingStream(getAudioInputConstraints(audioInputSettings));

      inputMonitorStreamRef.current = stream;

      const didConnect = await connectInputMonitor(stream);

      if (!didConnect) {
        stopInputMonitoring();
      }

      return didConnect;
    } catch {
      stopInputMonitoring();

      return false;
    }
  }, [audioInputSettings, connectInputMonitor, stopInputMonitoring]);

  const updateDuration = useCallback(() => {
    setRecordingDurationSeconds(getRecordingElapsedSeconds(accumulatedMillisecondsRef.current, activeStartedAtRef.current));
  }, []);

  const startDurationTimer = useCallback(() => {
    clearDurationTimer();
    updateDuration();

    durationTimerRef.current = window.setInterval(updateDuration, 500);
  }, [clearDurationTimer, updateDuration]);

  const cleanupRecorderRefs = useCallback(() => {
    clearDurationTimer();
    stopMediaStreamTracks(mediaStreamRef.current);

    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;
    chunksRef.current = [];
    activeStartedAtRef.current = null;
    accumulatedMillisecondsRef.current = 0;
  }, [clearDurationTimer]);

  const discardRecording = useCallback(async () => {
    const mediaRecorder = mediaRecorderRef.current;

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      await new Promise((resolve) => {
        mediaRecorder.onstop = () => {
          resolve();
        };

        mediaRecorder.stop();
      });
    }

    cleanupRecorderRefs();
    stopInputMonitoring();
    setIsSessionRecording(false);
    setIsSessionRecordingPaused(false);
    setRecordingDurationSeconds(0);
    setRecordingInputLevel(0);
    setPendingRecording(null);
    setRecordingMessage("");
  }, [cleanupRecorderRefs, stopInputMonitoring]);

  const startRecording = useCallback(async () => {
    if (isSessionRecording) return true;

    if (!isAudioRecordingSupported()) {
      setRecordingMessage("Recording is not supported in this browser.");
      return false;
    }

    try {
      setPendingRecording(null);
      setRecordingDurationSeconds(0);
      setRecordingMessage("Requesting microphone access...");

      const stream = await requestAudioRecordingStream(getAudioInputConstraints(audioInputSettings));
      const mediaRecorder = createAudioRecorder(stream);

      chunksRef.current = [];
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data?.size) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = () => {
        setRecordingMessage("Recording error. Stop and try again.");
      };

      mediaRecorder.start(250);

      activeStartedAtRef.current = Date.now();
      accumulatedMillisecondsRef.current = 0;

      setIsSessionRecording(true);
      setIsSessionRecordingPaused(false);
      setRecordingMessage("Recording session audio...");

      if (!inputMonitorStreamRef.current) {
        void startInputMonitoring();
      }

      startDurationTimer();

      return true;
    } catch {
      cleanupRecorderRefs();
      setIsSessionRecording(false);
      setIsSessionRecordingPaused(false);
      setRecordingDurationSeconds(0);
      setRecordingMessage("Microphone access was unavailable or denied.");

      return false;
    }
  }, [audioInputSettings, cleanupRecorderRefs, isSessionRecording, startDurationTimer, startInputMonitoring]);

  const pauseRecording = useCallback(async () => {
    const mediaRecorder = mediaRecorderRef.current;

    if (!mediaRecorder || !isSessionRecording || isSessionRecordingPaused) return false;

    const didPause = pauseMediaRecorder(mediaRecorder);

    if (!didPause) {
      setRecordingMessage("This browser does not support pausing recordings.");
      return false;
    }

    if (activeStartedAtRef.current) {
      accumulatedMillisecondsRef.current += Date.now() - activeStartedAtRef.current;
      activeStartedAtRef.current = null;
    }

    clearDurationTimer();
    updateDuration();

    setIsSessionRecordingPaused(true);
    setRecordingMessage("Recording paused.");

    return true;
  }, [clearDurationTimer, isSessionRecording, isSessionRecordingPaused, updateDuration]);

  const resumeRecording = useCallback(async () => {
    const mediaRecorder = mediaRecorderRef.current;

    if (!mediaRecorder || !isSessionRecording || !isSessionRecordingPaused) return false;

    const didResume = resumeMediaRecorder(mediaRecorder);

    if (!didResume) {
      setRecordingMessage("This browser does not support resuming recordings.");
      return false;
    }

    activeStartedAtRef.current = Date.now();

    setIsSessionRecordingPaused(false);
    setRecordingMessage("Recording session audio...");
    startDurationTimer();

    return true;
  }, [isSessionRecording, isSessionRecordingPaused, startDurationTimer]);

  const stopRecording = useCallback(async () => {
    const mediaRecorder = mediaRecorderRef.current;

    if (!mediaRecorder) {
      return pendingRecording;
    }

    const durationSeconds = getRecordingElapsedSeconds(accumulatedMillisecondsRef.current, activeStartedAtRef.current);
    const mimeType = mediaRecorder.mimeType || "audio/webm";

    return new Promise((resolve) => {
      mediaRecorder.onstop = () => {
        const blob = chunksRef.current.length
          ? new Blob(chunksRef.current, {
              type: mimeType,
            })
          : null;

        const recording = blob?.size
          ? {
              blob,
              mimeType: blob.type || mimeType,
              durationSeconds,
              createdAt: new Date().toISOString(),
            }
          : null;

        cleanupRecorderRefs();

        setIsSessionRecording(false);
        setIsSessionRecordingPaused(false);
        setRecordingDurationSeconds(durationSeconds);
        setPendingRecording(recording);
        setRecordingMessage(recording ? `Recording ready (${formatRecordingDuration(durationSeconds)}).` : "No recording audio was captured.");

        resolve(recording);
      };

      if (mediaRecorder.state === "inactive") {
        mediaRecorder.onstop();
      } else {
        mediaRecorder.stop();
      }
    });
  }, [cleanupRecorderRefs, pendingRecording]);

  useEffect(() => {
    return () => {
      void discardRecording();
    };
  }, [discardRecording]);

  return {
    discardRecording,
    hasPendingRecording: Boolean(pendingRecording),
    isSessionRecording,
    isSessionRecordingPaused,
    pendingRecording,
    pauseRecording,
    recordingDurationSeconds,
    recordingInputLevel,
    recordingMessage,
    resumeRecording,
    startInputMonitoring,
    startRecording,
    stopInputMonitoring,
    stopRecording,
  };
}
