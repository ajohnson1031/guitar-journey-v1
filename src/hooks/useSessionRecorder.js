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

  const recordingAudioContextRef = useRef(null);
  const recordingLevelFrameRef = useRef(null);
  const recordingLevelSourceRef = useRef(null);
  const displayedRecordingLevelRef = useRef(0);

  const clearDurationTimer = useCallback(() => {
    if (durationTimerRef.current) {
      window.clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

  const clearRecordingLevelFrame = useCallback(() => {
    if (recordingLevelFrameRef.current) {
      window.cancelAnimationFrame(recordingLevelFrameRef.current);
      recordingLevelFrameRef.current = null;
    }
  }, []);

  const cleanupRecordingInputMonitor = useCallback(() => {
    clearRecordingLevelFrame();

    if (recordingLevelSourceRef.current) {
      try {
        recordingLevelSourceRef.current.disconnect();
      } catch {
        // Source may already be disconnected.
      }

      recordingLevelSourceRef.current = null;
    }

    if (recordingAudioContextRef.current && recordingAudioContextRef.current.state !== "closed") {
      void recordingAudioContextRef.current.close();
    }

    recordingAudioContextRef.current = null;
    displayedRecordingLevelRef.current = 0;
    setRecordingInputLevel(0);
  }, [clearRecordingLevelFrame]);

  const updateDuration = useCallback(() => {
    setRecordingDurationSeconds(getRecordingElapsedSeconds(accumulatedMillisecondsRef.current, activeStartedAtRef.current));
  }, []);

  const startDurationTimer = useCallback(() => {
    clearDurationTimer();
    updateDuration();

    durationTimerRef.current = window.setInterval(updateDuration, 500);
  }, [clearDurationTimer, updateDuration]);

  const startRecordingInputMonitor = useCallback(
    async (stream) => {
      cleanupRecordingInputMonitor();

      const AudioContextConstructor = getAudioContextConstructor();

      if (!stream || !AudioContextConstructor) return;

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

        recordingAudioContextRef.current = audioContext;
        recordingLevelSourceRef.current = source;
        displayedRecordingLevelRef.current = 0;

        function readRecordingInputLevel() {
          analyser.getByteTimeDomainData(dataArray);

          const rawLevel = getMicrophoneLevelFromTimeDomainData(dataArray);
          const decayedLevel = displayedRecordingLevelRef.current * RECORDING_LEVEL_DECAY;
          const nextLevel = normalizeMicrophoneLevel(Math.max(rawLevel, decayedLevel));

          displayedRecordingLevelRef.current = nextLevel;
          setRecordingInputLevel(nextLevel);

          recordingLevelFrameRef.current = window.requestAnimationFrame(readRecordingInputLevel);
        }

        readRecordingInputLevel();
      } catch {
        cleanupRecordingInputMonitor();
      }
    },
    [cleanupRecordingInputMonitor],
  );

  const cleanupRecorderRefs = useCallback(() => {
    clearDurationTimer();
    cleanupRecordingInputMonitor();
    stopMediaStreamTracks(mediaStreamRef.current);

    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;
    chunksRef.current = [];
    activeStartedAtRef.current = null;
    accumulatedMillisecondsRef.current = 0;
  }, [cleanupRecordingInputMonitor, clearDurationTimer]);

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
    setIsSessionRecording(false);
    setIsSessionRecordingPaused(false);
    setRecordingDurationSeconds(0);
    setRecordingInputLevel(0);
    setPendingRecording(null);
    setRecordingMessage("");
  }, [cleanupRecorderRefs]);

  const startRecording = useCallback(async () => {
    if (isSessionRecording) return true;

    if (!isAudioRecordingSupported()) {
      setRecordingMessage("Recording is not supported in this browser.");
      return false;
    }

    try {
      setPendingRecording(null);
      setRecordingDurationSeconds(0);
      setRecordingInputLevel(0);
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
      await startRecordingInputMonitor(stream);
      startDurationTimer();

      return true;
    } catch {
      cleanupRecorderRefs();
      setIsSessionRecording(false);
      setIsSessionRecordingPaused(false);
      setRecordingDurationSeconds(0);
      setRecordingInputLevel(0);
      setRecordingMessage("Microphone access was unavailable or denied.");

      return false;
    }
  }, [audioInputSettings, cleanupRecorderRefs, isSessionRecording, startDurationTimer, startRecordingInputMonitor]);

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
    cleanupRecordingInputMonitor();
    updateDuration();

    setIsSessionRecordingPaused(true);
    setRecordingMessage("Recording paused.");

    return true;
  }, [clearDurationTimer, cleanupRecordingInputMonitor, isSessionRecording, isSessionRecordingPaused, updateDuration]);

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
    await startRecordingInputMonitor(mediaStreamRef.current);
    startDurationTimer();

    return true;
  }, [isSessionRecording, isSessionRecordingPaused, startDurationTimer, startRecordingInputMonitor]);

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
        setRecordingInputLevel(0);
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
    startRecording,
    stopRecording,
  };
}
