import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SessionHistory from "../SessionHistory";

const { Fragment } = React;

const mockPlaybackState = vi.hoisted(() => ({
  activeRecordingId: "",
  isLoadingRecording: false,
  isPlayingRecording: false,
  playbackMessage: "",
  playbackMessageRecordingId: "",
  playbackState: "idle",
  playRecording: vi.fn(),
  stopPlayback: vi.fn(),
}));

const mockRecordingStorageState = vi.hoisted(() => ({
  recordings: [],
}));

vi.mock("../../utils/recordingStorageUtils", async () => {
  const actual = await vi.importActual("../../utils/recordingStorageUtils");

  return {
    ...actual,
    getAllRecordings: vi.fn(() => Promise.resolve(mockRecordingStorageState.recordings)),
  };
});

vi.mock("../../hooks", () => ({
  useRecordingPlayback: () => mockPlaybackState,
}));

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

function renderSessionHistory(props = {}) {
  const mergedProps = {
    historySongFilter: null,
    onClearHistorySongFilter: vi.fn(),
    onDeleteSessionRecording: vi.fn(),
    sessions: [],
    ...props,
  };

  const view = render(
    <Fragment>
      <SessionHistory {...mergedProps} />
    </Fragment>,
  );

  return {
    ...view,
    props: mergedProps,
  };
}

function resetPlaybackState() {
  mockPlaybackState.activeRecordingId = "";
  mockPlaybackState.isLoadingRecording = false;
  mockPlaybackState.isPlayingRecording = false;
  mockPlaybackState.playbackMessage = "";
  mockPlaybackState.playbackMessageRecordingId = "";
  mockPlaybackState.playbackState = "idle";
  mockPlaybackState.playRecording.mockReset();
  mockPlaybackState.stopPlayback.mockReset();
  mockRecordingStorageState.recordings = [];
}

describe("SessionHistory", () => {
  afterEach(() => {
    cleanup();
    resetPlaybackState();
    vi.restoreAllMocks();
  });

  it("groups sessions by date and shows daily session counts and totals", () => {
    const { container } = renderSessionHistory({
      sessions: [
        createSession({
          id: "morning",
          songTitle: "Morning Song",
          minutes: 15,
          completedAt: "2026-05-30T09:00:00",
        }),
        createSession({
          id: "evening",
          songTitle: "Evening Song",
          minutes: 25,
          completedAt: "2026-05-30T19:00:00",
        }),
        createSession({
          id: "yesterday",
          songTitle: "Yesterday Blues",
          minutes: 30,
          completedAt: "2026-05-29T19:00:00",
        }),
      ],
    });

    const dayGroups = Array.from(container.querySelectorAll(".history-day-group"));

    expect(dayGroups).toHaveLength(2);

    expect(dayGroups[0].textContent).toContain("May 30, 2026");
    expect(dayGroups[0].textContent).toContain("2 sessions");
    expect(dayGroups[0].textContent).toContain("40m");
    expect(dayGroups[0].textContent).toContain("Evening Song");
    expect(dayGroups[0].textContent).toContain("Morning Song");

    expect(dayGroups[1].textContent).toContain("May 29, 2026");
    expect(dayGroups[1].textContent).toContain("1 session");
    expect(dayGroups[1].textContent).toContain("30m");
    expect(dayGroups[1].textContent).toContain("Yesterday Blues");
  });

  it("filters sessions by search", () => {
    renderSessionHistory({
      sessions: [
        createSession({
          id: "worship",
          songTitle: "Worship Song",
          genre: "Worship",
        }),
        createSession({
          id: "blues",
          songTitle: "Blues Song",
          genre: "Blues",
        }),
      ],
    });

    fireEvent.change(screen.getByLabelText("Search sessions"), {
      target: {
        value: "worship",
      },
    });

    expect(screen.getByText("Worship Song")).toBeTruthy();
    expect(screen.queryByText("Blues Song")).toBeNull();
  });

  it("filters sessions by selected history song before applying search", () => {
    const onClearHistorySongFilter = vi.fn();

    renderSessionHistory({
      historySongFilter: {
        songId: "song-worship",
        songTitle: "Worship Song",
      },
      onClearHistorySongFilter,
      sessions: [
        createSession({
          id: "worship",
          songId: "song-worship",
          songTitle: "Worship Song",
          genre: "Worship",
        }),
        createSession({
          id: "blues",
          songId: "song-blues",
          songTitle: "Blues Song",
          genre: "Blues",
        }),
      ],
    });

    expect(screen.getByText("Viewing song history")).toBeTruthy();
    expect(screen.getAllByText("Worship Song").length).toBeGreaterThan(0);
    expect(screen.queryByText("Blues Song")).toBeNull();

    fireEvent.change(screen.getByLabelText("Search sessions"), {
      target: {
        value: "blues",
      },
    });

    expect(screen.getByText("No sessions match this filter")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Clear Filter" }));

    expect(onClearHistorySongFilter).toHaveBeenCalledTimes(1);
  });

  it("sorts sessions oldest first when selected", () => {
    const { container } = renderSessionHistory({
      sessions: [
        createSession({
          id: "newer",
          songTitle: "Newer Song",
          completedAt: "2026-05-31T09:00:00",
        }),
        createSession({
          id: "older",
          songTitle: "Older Song",
          completedAt: "2026-05-29T09:00:00",
        }),
      ],
    });

    fireEvent.change(screen.getByLabelText("Sort sessions"), {
      target: {
        value: "oldest",
      },
    });

    const dayGroups = Array.from(container.querySelectorAll(".history-day-group"));

    expect(dayGroups[0].textContent).toContain("May 29, 2026");
    expect(dayGroups[0].textContent).toContain("Older Song");
    expect(dayGroups[1].textContent).toContain("May 31, 2026");
    expect(dayGroups[1].textContent).toContain("Newer Song");
  });

  it("sorts sessions by duration inside each date group", () => {
    const { container } = renderSessionHistory({
      sessions: [
        createSession({
          id: "long",
          songTitle: "Long Song",
          completedAt: "2026-05-30T10:00:00",
          elapsedSeconds: 1800,
        }),
        createSession({
          id: "short",
          songTitle: "Short Song",
          completedAt: "2026-05-30T09:00:00",
          elapsedSeconds: 300,
        }),
      ],
    });

    fireEvent.change(screen.getByLabelText("Sort sessions"), {
      target: {
        value: "shortest",
      },
    });

    const cards = Array.from(container.querySelectorAll(".history-card"));

    expect(cards[0].textContent).toContain("Short Song");
    expect(cards[1].textContent).toContain("Long Song");

    fireEvent.change(screen.getByLabelText("Sort sessions"), {
      target: {
        value: "longest",
      },
    });

    const resortedCards = Array.from(container.querySelectorAll(".history-card"));

    expect(resortedCards[0].textContent).toContain("Long Song");
    expect(resortedCards[1].textContent).toContain("Short Song");
  });

  it("adds a scrollable class after more than five visible sessions", () => {
    const { container } = renderSessionHistory({
      sessions: Array.from({ length: 6 }, (_, index) =>
        createSession({
          id: `session-${index}`,
          songTitle: `Session ${index}`,
          completedAt: `2026-05-30T${String(index + 8).padStart(2, "0")}:00:00`,
        }),
      ),
    });

    expect(container.querySelector(".history-day-group-list")?.className).toContain("is-scrollable");
  });

  it("shows recording controls only for sessions with stored recordings", async () => {
    mockRecordingStorageState.recordings = [
      {
        recordingId: "recording-recorded",
      },
    ];

    renderSessionHistory({
      sessions: [
        createSession({
          id: "recorded",
          songTitle: "Recorded Song",
          recordingDurationSeconds: 62,
          recordingId: "recording-recorded",
          recordingMimeType: "audio/webm",
        }),
        createSession({
          id: "silent",
          songTitle: "Silent Song",
        }),
      ],
    });

    expect(await screen.findByRole("button", { name: "Play Recording" })).toBeTruthy();
    expect(screen.getByLabelText("Stop playback")).toBeTruthy();
    expect(screen.getByLabelText("Delete recording for Recorded Song")).toBeTruthy();
    expect(screen.queryByLabelText("Delete recording for Silent Song")).toBeNull();
  });

  it("shows a removed recording pill when a session references a missing recording", async () => {
    renderSessionHistory({
      sessions: [
        createSession({
          id: "missing-recording",
          songTitle: "Missing Recording Song",
          recordingDurationSeconds: 62,
          recordingId: "recording-missing",
          recordingMimeType: "audio/webm",
        }),
      ],
    });

    expect(await screen.findByText("Recording removed")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Play Recording" })).toBeNull();
    expect(screen.queryByLabelText("Delete recording for Missing Recording Song")).toBeNull();
  });

  it("shows a removed recording pill when a session has an explicit removed recording marker", () => {
    renderSessionHistory({
      sessions: [
        createSession({
          id: "removed-recording",
          songTitle: "Removed Recording Song",
          recordingRemovedAt: "2026-05-31T12:00:00.000Z",
        }),
      ],
    });

    expect(screen.getByText("Recording removed")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Play Recording" })).toBeNull();
    expect(screen.queryByLabelText("Delete recording for Removed Recording Song")).toBeNull();
  });

  it("uses Pause Playback text while a stored recording is playing", async () => {
    mockRecordingStorageState.recordings = [
      {
        recordingId: "recording-playing",
      },
    ];

    mockPlaybackState.activeRecordingId = "recording-playing";
    mockPlaybackState.isPlayingRecording = true;
    mockPlaybackState.playbackState = "playing";

    renderSessionHistory({
      sessions: [
        createSession({
          id: "playing",
          songTitle: "Playing Song",
          recordingDurationSeconds: 62,
          recordingId: "recording-playing",
          recordingMimeType: "audio/webm",
        }),
      ],
    });

    expect(await screen.findByRole("button", { name: "Pause Playback" })).toBeTruthy();
    expect(screen.getByLabelText("Stop playback").disabled).toBe(false);
  });

  it("renders the empty history state", () => {
    renderSessionHistory();

    expect(screen.getByText("No completed sessions yet")).toBeTruthy();
    expect(screen.getByText("Finish today’s plan to start building streaks, weekly totals, and a real practice log.")).toBeTruthy();
  });
});
