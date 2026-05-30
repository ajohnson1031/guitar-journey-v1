import * as React from "react";
import { getRecording } from "../utils/recordingStorageUtils";

const { useCallback, useEffect, useRef, useState } = React;

const PLAYBACK_MESSAGE_TIMEOUT_MS = 5000;

export default function useRecordingPlayback() {
  const audioRef = useRef(null);
  const objectUrlRef = useRef("");
  const playbackMessageTimerRef = useRef(null);

  const [activeRecordingId, setActiveRecordingId] = useState("");
  const [isLoadingRecording, setIsLoadingRecording] = useState(false);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [playbackMessage, setPlaybackMessage] = useState("");
  const [playbackMessageRecordingId, setPlaybackMessageRecordingId] = useState("");
  const [playbackState, setPlaybackState] = useState("idle");

  const clearPlaybackMessageTimer = useCallback(() => {
    if (playbackMessageTimerRef.current) {
      window.clearTimeout(playbackMessageTimerRef.current);
      playbackMessageTimerRef.current = null;
    }
  }, []);

  const clearPlaybackMessage = useCallback(() => {
    clearPlaybackMessageTimer();
    setPlaybackMessage("");
    setPlaybackMessageRecordingId("");
  }, [clearPlaybackMessageTimer]);

  const showPlaybackMessage = useCallback(
    (message, recordingId) => {
      clearPlaybackMessageTimer();

      setPlaybackMessage(message);
      setPlaybackMessageRecordingId(recordingId);

      playbackMessageTimerRef.current = window.setTimeout(() => {
        setPlaybackMessage("");
        setPlaybackMessageRecordingId("");
        playbackMessageTimerRef.current = null;
      }, PLAYBACK_MESSAGE_TIMEOUT_MS);
    },
    [clearPlaybackMessageTimer],
  );

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.load();
      audioRef.current = null;
    }

    if (objectUrlRef.current) {
      window.URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }
  }, []);

  const stopPlayback = useCallback(
    (recordingId = activeRecordingId) => {
      const targetRecordingId = String(recordingId || activeRecordingId || "").trim();

      if (!targetRecordingId) return;

      cleanupAudio();
      setActiveRecordingId("");
      setIsLoadingRecording(false);
      setIsPlayingRecording(false);
      setPlaybackState("stopped");
      showPlaybackMessage("Playback stopped.", targetRecordingId);
    },
    [activeRecordingId, cleanupAudio, showPlaybackMessage],
  );

  const playRecording = useCallback(
    async (session) => {
      const recordingId = String(session?.recordingId || "").trim();

      if (!recordingId) return false;

      if (activeRecordingId === recordingId && audioRef.current) {
        if (isPlayingRecording) {
          audioRef.current.pause();
          setIsPlayingRecording(false);
          setPlaybackState("paused");
          clearPlaybackMessage();
          return true;
        }

        try {
          if (audioRef.current.ended) {
            audioRef.current.currentTime = 0;
          }

          await audioRef.current.play();
          setIsPlayingRecording(true);
          setPlaybackState("playing");
          clearPlaybackMessage();
          return true;
        } catch {
          setPlaybackState("error");
          showPlaybackMessage("Recording could not play in this browser.", recordingId);
          return false;
        }
      }

      setIsLoadingRecording(true);
      setPlaybackState("loading");
      clearPlaybackMessage();
      cleanupAudio();

      try {
        const savedRecording = await getRecording(recordingId);

        if (!savedRecording?.blob) {
          setActiveRecordingId("");
          setPlaybackState("error");
          showPlaybackMessage("Recording could not be found on this device.", recordingId);
          return false;
        }

        const objectUrl = window.URL.createObjectURL(savedRecording.blob);
        const audio = new Audio(objectUrl);

        audioRef.current = audio;
        objectUrlRef.current = objectUrl;

        audio.onended = () => {
          setIsPlayingRecording(false);
          setPlaybackState("finished");
          showPlaybackMessage("Playback finished.", recordingId);
        };

        audio.onerror = () => {
          setIsPlayingRecording(false);
          setPlaybackState("error");
          showPlaybackMessage("Recording could not play in this browser.", recordingId);
        };

        setActiveRecordingId(recordingId);

        await audio.play();

        setIsPlayingRecording(true);
        setPlaybackState("playing");
        clearPlaybackMessage();
        return true;
      } catch {
        cleanupAudio();
        setActiveRecordingId("");
        setPlaybackState("error");
        showPlaybackMessage("Recording could not play in this browser.", recordingId);
        return false;
      } finally {
        setIsLoadingRecording(false);
      }
    },
    [activeRecordingId, clearPlaybackMessage, cleanupAudio, isPlayingRecording, showPlaybackMessage],
  );

  useEffect(() => {
    return () => {
      clearPlaybackMessageTimer();
      cleanupAudio();
    };
  }, [clearPlaybackMessageTimer, cleanupAudio]);

  return {
    activeRecordingId,
    isLoadingRecording,
    isPlayingRecording,
    playbackMessage,
    playbackMessageRecordingId,
    playbackState,
    playRecording,
    stopPlayback,
  };
}
