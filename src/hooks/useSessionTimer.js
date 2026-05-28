import * as React from "react";

const { useEffect, useState } = React;

function secondsToPracticeMinutes(totalSeconds) {
  if (!totalSeconds) return 0;

  return Math.max(1, Math.ceil(totalSeconds / 60));
}

export default function useSessionTimer({ resetKeys = [] } = {}) {
  const [isSessionTimerRunning, setIsSessionTimerRunning] = useState(false);
  const [elapsedSessionSeconds, setElapsedSessionSeconds] = useState(0);

  const actualPracticeMinutes = secondsToPracticeMinutes(elapsedSessionSeconds);
  const canCompleteSession = elapsedSessionSeconds > 0;

  useEffect(() => {
    if (!isSessionTimerRunning) return undefined;

    const intervalId = window.setInterval(() => {
      setElapsedSessionSeconds((currentSeconds) => currentSeconds + 1);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isSessionTimerRunning]);

  useEffect(() => {
    setIsSessionTimerRunning(false);
    setElapsedSessionSeconds(0);
  }, resetKeys);

  function toggleSessionTimer() {
    setIsSessionTimerRunning((isRunning) => !isRunning);
  }

  function resetSessionTimer() {
    setIsSessionTimerRunning(false);
    setElapsedSessionSeconds(0);
  }

  return {
    actualPracticeMinutes,
    canCompleteSession,
    elapsedSessionSeconds,
    isSessionTimerRunning,
    resetSessionTimer,
    setElapsedSessionSeconds,
    setIsSessionTimerRunning,
    toggleSessionTimer,
  };
}
