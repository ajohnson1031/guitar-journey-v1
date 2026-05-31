import { describe, expect, it } from "vitest";
import { formatActiveSessionElapsedTime, getActiveSessionStatus, getRouteRecordingSyncAction } from "../activeSessionUtils";

describe("activeSessionUtils", () => {
  it("formats active session elapsed time", () => {
    expect(formatActiveSessionElapsedTime(0)).toBe("00:00");
    expect(formatActiveSessionElapsedTime(125)).toBe("02:05");
    expect(formatActiveSessionElapsedTime(3725)).toBe("1:02:05");
  });

  it("returns active session status labels", () => {
    expect(getActiveSessionStatus({ isSessionTimerRunning: true }).label).toBe("Session running");
    expect(getActiveSessionStatus({ isSessionRecording: true }).label).toBe("Recording");
    expect(getActiveSessionStatus({ isSessionRecording: true, isSessionRecordingPaused: true }).label).toBe("Recording paused");
    expect(getActiveSessionStatus({ hasPendingRecording: true }).label).toBe("Recording ready");
  });

  it("pauses recording when leaving dashboard while recording", () => {
    expect(
      getRouteRecordingSyncAction({
        isDashboardRoute: false,
        isSessionRecording: true,
        isSessionRecordingPaused: false,
        wasAutoPaused: false,
      }),
    ).toBe("pause");
  });

  it("resumes only recordings that were auto-paused by route change", () => {
    expect(
      getRouteRecordingSyncAction({
        isDashboardRoute: true,
        isSessionRecording: true,
        isSessionRecordingPaused: true,
        wasAutoPaused: true,
      }),
    ).toBe("resume");

    expect(
      getRouteRecordingSyncAction({
        isDashboardRoute: true,
        isSessionRecording: true,
        isSessionRecordingPaused: true,
        wasAutoPaused: false,
      }),
    ).toBe("none");
  });

  it("clears auto-pause state when recording is no longer active", () => {
    expect(
      getRouteRecordingSyncAction({
        isDashboardRoute: false,
        isSessionRecording: false,
        isSessionRecordingPaused: false,
        wasAutoPaused: true,
      }),
    ).toBe("clear-auto-pause");
  });
});
