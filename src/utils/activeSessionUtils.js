function formatActiveSessionElapsedTime(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getActiveSessionStatus({ hasPendingRecording = false, isSessionRecording = false, isSessionRecordingPaused = false, isSessionTimerRunning = false } = {}) {
  if (isSessionRecording && isSessionRecordingPaused) {
    return {
      className: "is-recording-paused",
      label: "Recording paused",
    };
  }

  if (isSessionRecording) {
    return {
      className: "is-recording",
      label: "Recording",
    };
  }

  if (hasPendingRecording) {
    return {
      className: "is-recording-ready",
      label: "Recording ready",
    };
  }

  if (isSessionTimerRunning) {
    return {
      className: "is-running",
      label: "Session running",
    };
  }

  return {
    className: "is-paused",
    label: "Session paused",
  };
}

function getRouteRecordingSyncAction({ isDashboardRoute, isSessionRecording, isSessionRecordingPaused, wasAutoPaused }) {
  if (!isSessionRecording) {
    return wasAutoPaused ? "clear-auto-pause" : "none";
  }

  if (!isDashboardRoute && !isSessionRecordingPaused && !wasAutoPaused) {
    return "pause";
  }

  if (isDashboardRoute && isSessionRecordingPaused && wasAutoPaused) {
    return "resume";
  }

  return "none";
}

export { formatActiveSessionElapsedTime, getActiveSessionStatus, getRouteRecordingSyncAction };
