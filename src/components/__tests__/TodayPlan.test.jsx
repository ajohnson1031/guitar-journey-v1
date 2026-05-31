import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TodayPlan from "../TodayPlan";

const { Fragment } = React;

const BASE_PLAN = [
  {
    label: "Warm up",
    minutes: 3,
    detail: "Play each chord slowly.",
  },
  {
    label: "Transition drill",
    minutes: 7,
    detail: "Loop the main changes.",
  },
];

function createSession(overrides = {}) {
  return {
    id: "session-test",
    songId: "song-test",
    songTitle: "Test Song",
    genre: "Blues",
    plannedMinutes: 20,
    minutes: 20,
    elapsedSeconds: 1200,
    rating: "Okay",
    completedStepCount: 2,
    totalStepCount: 5,
    completedAt: "2026-05-30T12:00:00",
    ...overrides,
  };
}

function createProps(overrides = {}) {
  return {
    actualPracticeMinutes: 0,
    canCompleteSession: false,
    completedSteps: {},
    elapsedSessionSeconds: 0,
    hasPendingRecording: false,
    isSessionRecording: false,
    isSessionRecordingPaused: false,
    isSessionTimerRunning: false,
    onCompleteSession: vi.fn(),
    onPauseSessionRecording: vi.fn(),
    onResetSessionTimer: vi.fn(),
    onResumeSessionRecording: vi.fn(),
    onSessionMinutesChange: vi.fn(),
    onSessionRatingChange: vi.fn(),
    onToggleSessionRecording: vi.fn(),
    onToggleSessionTimer: vi.fn(),
    onToggleStep: vi.fn(),
    plan: BASE_PLAN,
    progressPercent: 0,
    recordingDurationSeconds: 0,
    recordingInputLevel: 0,
    recordingMessage: "",
    sessionHistory: [],
    sessionMessage: "",
    sessionMinutes: 20,
    sessionRating: "",
    ...overrides,
  };
}

function renderTodayPlan(props = {}) {
  const mergedProps = createProps(props);

  render(
    <Fragment>
      <TodayPlan {...mergedProps} />
    </Fragment>,
  );

  return mergedProps;
}

describe("TodayPlan", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-30T12:00:00"));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders an empty today's practice summary when no sessions exist today", () => {
    renderTodayPlan();

    expect(screen.getByText("Today’s Practice")).toBeTruthy();
    expect(screen.getByText("No saved sessions today")).toBeTruthy();
    expect(screen.getByText("Start and save a session today to build momentum.")).toBeTruthy();
    expect(screen.getByText("0 days")).toBeTruthy();
    expect(screen.getAllByText("0m").length).toBeGreaterThanOrEqual(2);
  });

  it("renders today's session count, today's minutes, this week total, and current streak", () => {
    renderTodayPlan({
      sessionHistory: [
        createSession({
          id: "today-early",
          minutes: 15,
          completedAt: "2026-05-30T09:00:00",
        }),
        createSession({
          id: "today-late",
          minutes: 25,
          completedAt: "2026-05-30T19:00:00",
        }),
        createSession({
          id: "this-week",
          minutes: 40,
          completedAt: "2026-05-27T19:00:00",
        }),
        createSession({
          id: "older",
          minutes: 99,
          completedAt: "2026-05-17T19:00:00",
        }),
      ],
    });

    expect(screen.getByText("2 saved sessions")).toBeTruthy();
    expect(screen.getByText("You’ve logged 40m today. Keep the streak alive with one focused session.")).toBeTruthy();
    expect(screen.getByText("40m")).toBeTruthy();
    expect(screen.getByText("1h 20m")).toBeTruthy();
    expect(screen.getByText("1 day")).toBeTruthy();
  });

  it("keeps rating controls disabled until a session has started", () => {
    renderTodayPlan();

    expect(screen.getByRole("button", { name: "Hard" }).disabled).toBe(true);
    expect(screen.getByRole("button", { name: "Okay" }).disabled).toBe(true);
    expect(screen.getByRole("button", { name: "Easy" }).disabled).toBe(true);
  });

  it("expands the first plan card by default", () => {
    renderTodayPlan();

    expect(screen.getByRole("button", { name: "Warm up practice step" }).getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("button", { name: "Transition drill practice step" }).getAttribute("aria-expanded")).toBe("false");
  });

  it("expands the selected plan card and collapses the previous card", () => {
    renderTodayPlan();

    fireEvent.click(screen.getByRole("button", { name: "Transition drill practice step" }));

    expect(screen.getByRole("button", { name: "Warm up practice step" }).getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByRole("button", { name: "Transition drill practice step" }).getAttribute("aria-expanded")).toBe("true");
  });

  it("uses a dedicated completion button so expanding does not toggle completion", () => {
    const props = renderTodayPlan();

    fireEvent.click(screen.getByRole("button", { name: "Transition drill practice step" }));
    expect(props.onToggleStep).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Mark Transition drill complete" }));
    expect(props.onToggleStep).toHaveBeenCalledWith("Transition drill");
  });

  it("hides the live input meter until a session is active", () => {
    renderTodayPlan();

    expect(screen.queryByText("Live input")).toBeNull();
    expect(screen.queryByLabelText("Session recording input level")).toBeNull();
  });

  it("renders a live input meter during an active session before recording starts", () => {
    renderTodayPlan({
      elapsedSessionSeconds: 5,
      isSessionTimerRunning: true,
      recordingInputLevel: 0.7,
    });

    expect(screen.getByLabelText("Live input")).toBeTruthy();
    expect(screen.getByText("Monitoring")).toBeTruthy();
    expect(screen.getByLabelText("Session recording input level").className).toContain("is-level-high");
  });

  it("renders the miniature recording input meter while recording", () => {
    renderTodayPlan({
      elapsedSessionSeconds: 5,
      isSessionRecording: true,
      isSessionTimerRunning: true,
      recordingDurationSeconds: 4,
      recordingInputLevel: 0.7,
    });

    expect(screen.getByLabelText("Live input")).toBeTruthy();
    expect(screen.getByText("Recording")).toBeTruthy();
    expect(screen.getByLabelText("Session recording input level").className).toContain("is-level-high");
  });
});
