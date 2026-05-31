import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { formatActiveSessionElapsedTime, getActiveSessionStatus } from "../utils/activeSessionUtils";
import { MicIcon, PauseIcon, RecordIcon } from "./AppIcons";

const { Fragment } = React;

function getStatusIcon(statusClassName) {
  if (statusClassName === "is-recording") {
    return <RecordIcon />;
  }

  if (statusClassName === "is-recording-paused" || statusClassName === "is-paused") {
    return <PauseIcon />;
  }

  return <MicIcon />;
}

export default function ActiveSessionIndicator({
  elapsedSessionSeconds = 0,
  hasPendingRecording = false,
  isActive = false,
  isSessionRecording = false,
  isSessionRecordingPaused = false,
  isSessionTimerRunning = false,
}) {
  const location = useLocation();
  const isDashboardRoute = location.pathname === "/" || location.pathname === "";

  if (!isActive || isDashboardRoute) {
    return null;
  }

  const status = getActiveSessionStatus({
    hasPendingRecording,
    isSessionRecording,
    isSessionRecordingPaused,
    isSessionTimerRunning,
  });

  return (
    <Fragment>
      <Link to="/" className={`active-session-indicator ${status.className}`} aria-label="Active session indicator">
        <span className="active-session-indicator-icon">{getStatusIcon(status.className)}</span>

        <span className="active-session-indicator-copy">
          <strong>{formatActiveSessionElapsedTime(elapsedSessionSeconds)}</strong>
          <small>{status.label}</small>
        </span>
      </Link>
    </Fragment>
  );
}
