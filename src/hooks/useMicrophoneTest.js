import * as React from "react";
import { getAudioInputConstraints } from "../utils/settingsStorageUtils";
import { createMicrophoneTestSession, normalizeMicrophoneLevel } from "../utils/microphoneTestUtils";

const { useCallback, useEffect, useRef, useState } = React;

const MICROPHONE_LEVEL_DECAY = 0.68;

export default function useMicrophoneTest(audioInputSettings) {
  const animationFrameRef = useRef(null);
  const displayedLevelRef = useRef(0);
  const peakLevelRef = useRef(0);
  const sessionRef = useRef(null);

  const [isTestingMicrophone, setIsTestingMicrophone] = useState(false);
  const [microphoneLevel, setMicrophoneLevel] = useState(0);
  const [microphoneTestMessage, setMicrophoneTestMessage] = useState("");

  const clearAnimationFrame = useCallback(() => {
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const cleanupSession = useCallback(async () => {
    clearAnimationFrame();

    if (sessionRef.current) {
      await sessionRef.current.stop();
      sessionRef.current = null;
    }

    displayedLevelRef.current = 0;
    setIsTestingMicrophone(false);
    setMicrophoneLevel(0);
  }, [clearAnimationFrame]);

  const stopMicrophoneTest = useCallback(
    async (message = "Microphone test stopped.") => {
      await cleanupSession();
      setMicrophoneTestMessage(message);
    },
    [cleanupSession],
  );

  const readMicrophoneLevel = useCallback(() => {
    const session = sessionRef.current;

    if (!session) return;

    const rawLevel = normalizeMicrophoneLevel(session.readLevel());
    const decayedLevel = displayedLevelRef.current * MICROPHONE_LEVEL_DECAY;
    const nextLevel = Math.max(rawLevel, decayedLevel);

    displayedLevelRef.current = nextLevel;
    peakLevelRef.current = Math.max(peakLevelRef.current, rawLevel);
    setMicrophoneLevel(nextLevel);

    animationFrameRef.current = window.requestAnimationFrame(readMicrophoneLevel);
  }, []);

  const startMicrophoneTest = useCallback(async () => {
    if (isTestingMicrophone) return;

    await cleanupSession();

    displayedLevelRef.current = 0;
    peakLevelRef.current = 0;
    setMicrophoneLevel(0);
    setMicrophoneTestMessage("Microphone is active while this test is running.");
    setIsTestingMicrophone(true);

    try {
      const session = await createMicrophoneTestSession(getAudioInputConstraints(audioInputSettings));

      sessionRef.current = session;
      readMicrophoneLevel();
    } catch {
      await cleanupSession();
      setMicrophoneTestMessage("Microphone access was unavailable or denied.");
    }
  }, [audioInputSettings, cleanupSession, isTestingMicrophone, readMicrophoneLevel]);

  useEffect(() => {
    return () => {
      void cleanupSession();
    };
  }, [cleanupSession]);

  return {
    isTestingMicrophone,
    microphoneLevel,
    microphoneTestMessage,
    startMicrophoneTest,
    stopMicrophoneTest,
  };
}
