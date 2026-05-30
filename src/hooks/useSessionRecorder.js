import * as React from "react";
import {
  createAudioRecorder,
  isAudioRecordingSupported,
  pauseMediaRecorder,
  requestAudioRecordingStream,
  resumeMediaRecorder,
  stopMediaStreamTracks,
} from "../utils/audioRecordingUtils";
import { formatRecordingDuration } from "../utils/recordingStorageUtils";

const { useCallback, useEffect, useRef, useState } = React;

function getRecordingElapsedSeconds(accumulatedMilliseconds, activeStartedAt) {
  const activeMilliseconds = activeStartedAt ? Date.now() - activeStartedAt : 0;

  return Math.max(0, Math.floor((accumulatedMilliseconds + activeMilliseconds) / 1000));
}

export default function useSessionRecorder() {
  const [isSessionRecording, setIsSessionRecording] = useState(false);
  const [isSessionRecordingPaused, setIsSessionRecordingPaused] = useState(false);
  const [recordingDurationSeconds, setRecordingDurationSeconds] = useState(0);
  const [recordingMessage, setRecordingMessage] = useState("");
  const [pendingRecording, setPendingRecording] = useState(null);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const activeStartedAtRef = useRef(null);
  const accumulatedMillisecondsRef = useRef(0);
  const durationTimerRef = useRef(null);

  const clearDurationTimer = useCallback(() => {
    if (durationTimerRef.current) {
      window.clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

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
    setIsSessionRecording(false);
    setIsSessionRecordingPaused(false);
    setRecordingDurationSeconds(0);
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
      setRecordingMessage("Requesting microphone access...");

      const stream = await requestAudioRecordingStream();
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
  }, [cleanupRecorderRefs, isSessionRecording, startDurationTimer]);

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
    recordingMessage,
    resumeRecording,
    startRecording,
    stopRecording,
  };
}
