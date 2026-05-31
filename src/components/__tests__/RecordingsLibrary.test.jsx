import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RecordingsLibrary from "../RecordingsLibrary";

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
  deleteRecording: vi.fn(() => Promise.resolve(true)),
  recordings: [],
}));

vi.mock("../../hooks", () => ({
  useRecordingPlayback: () => mockPlaybackState,
}));

vi.mock("../../utils/recordingStorageUtils", async () => {
  const actual = await vi.importActual("../../utils/recordingStorageUtils");

  return {
    ...actual,
    deleteRecording: mockRecordingStorageState.deleteRecording,
    getAllRecordings: vi.fn(() => Promise.resolve(mockRecordingStorageState.recordings)),
  };
});

function createRecording(overrides = {}) {
  return {
    blob: new Blob(["test audio"], { type: "audio/webm" }),
    createdAt: "2026-05-30T12:00:00.000Z",
    durationSeconds: 62,
    mimeType: "audio/webm",
    recordingId: "recording-test",
    sessionId: "session-test",
    songId: "song-test",
    songTitle: "Test Song",
    ...overrides,
  };
}

function createSession(overrides = {}) {
  return {
    completedAt: "2026-05-30T12:00:00.000Z",
    id: "session-test",
    recordingDurationSeconds: 62,
    recordingId: "recording-test",
    recordingMimeType: "audio/webm",
    songId: "song-test",
    songTitle: "Test Song",
    ...overrides,
  };
}

function renderRecordingsLibrary(props = {}) {
  return render(<RecordingsLibrary sessions={[]} {...props} />);
}

function resetMocks() {
  mockPlaybackState.activeRecordingId = "";
  mockPlaybackState.isLoadingRecording = false;
  mockPlaybackState.isPlayingRecording = false;
  mockPlaybackState.playbackMessage = "";
  mockPlaybackState.playbackMessageRecordingId = "";
  mockPlaybackState.playbackState = "idle";
  mockPlaybackState.playRecording.mockReset();
  mockPlaybackState.stopPlayback.mockReset();

  mockRecordingStorageState.deleteRecording.mockReset();
  mockRecordingStorageState.deleteRecording.mockResolvedValue(true);
  mockRecordingStorageState.recordings = [];
}

describe("RecordingsLibrary", () => {
  afterEach(() => {
    cleanup();
    resetMocks();
    vi.restoreAllMocks();
  });

  it("groups linked and orphaned local recordings by recording date", async () => {
    mockRecordingStorageState.recordings = [
      createRecording({
        createdAt: "2026-05-30T12:00:00.000Z",
        durationSeconds: 62,
        recordingId: "recording-linked",
        sessionId: "session-linked",
        songTitle: "Stored Linked Title",
      }),
      createRecording({
        createdAt: "2026-05-30T13:00:00.000Z",
        durationSeconds: 64,
        recordingId: "recording-orphaned",
        sessionId: "session-orphaned",
        songTitle: "Orphaned Song",
      }),
      createRecording({
        createdAt: "2026-05-31T09:00:00.000Z",
        durationSeconds: 30,
        recordingId: "recording-newest",
        sessionId: "session-newest",
        songTitle: "Newest Song",
      }),
    ];

    const { container } = renderRecordingsLibrary({
      sessions: [
        createSession({
          id: "session-linked",
          recordingId: "recording-linked",
          songTitle: "Linked Song",
        }),
      ],
    });

    expect(await screen.findByText("Linked Song")).toBeTruthy();
    expect(screen.getByText("Orphaned Song")).toBeTruthy();
    expect(screen.getByText("Newest Song")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Linked" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Orphaned" })).toBeTruthy();

    expect(container.querySelectorAll(".recording-status-pill--linked")).toHaveLength(1);
    expect(container.querySelectorAll(".recording-status-pill--orphaned")).toHaveLength(2);

    const dayGroups = Array.from(container.querySelectorAll(".recording-library-day-group"));

    expect(dayGroups).toHaveLength(2);
    expect(dayGroups[0].textContent).toContain("May 31, 2026");
    expect(dayGroups[0].textContent).toContain("1 recording");
    expect(dayGroups[0].textContent).toContain("0:30 total");
    expect(dayGroups[0].textContent).toContain("Newest Song");

    expect(dayGroups[1].textContent).toContain("May 30, 2026");
    expect(dayGroups[1].textContent).toContain("2 recordings");
    expect(dayGroups[1].textContent).toContain("2:06 total");
    expect(dayGroups[1].textContent).toContain("Linked Song");
    expect(dayGroups[1].textContent).toContain("Orphaned Song");
  });

  it("filters recordings by search and status", async () => {
    mockRecordingStorageState.recordings = [
      createRecording({
        createdAt: "2026-05-30T12:00:00.000Z",
        recordingId: "recording-linked",
        sessionId: "session-linked",
        songTitle: "Stored Linked Title",
      }),
      createRecording({
        createdAt: "2026-05-30T13:00:00.000Z",
        recordingId: "recording-orphaned",
        sessionId: "session-orphaned",
        songTitle: "Orphaned Blues",
      }),
    ];

    renderRecordingsLibrary({
      sessions: [
        createSession({
          id: "session-linked",
          recordingId: "recording-linked",
          songTitle: "Linked Worship",
        }),
      ],
    });

    expect(await screen.findByText("Linked Worship")).toBeTruthy();
    expect(screen.getByText("Orphaned Blues")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Search recordings"), {
      target: {
        value: "blues",
      },
    });

    expect(screen.queryByText("Linked Worship")).toBeNull();
    expect(screen.getByText("Orphaned Blues")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Linked" }));

    expect(screen.getByText("No recordings match this filter")).toBeTruthy();
  });

  it("sorts recording groups oldest first", async () => {
    mockRecordingStorageState.recordings = [
      createRecording({
        createdAt: "2026-05-31T09:00:00.000Z",
        recordingId: "recording-newest",
        songTitle: "Newest Song",
      }),
      createRecording({
        createdAt: "2026-05-29T09:00:00.000Z",
        recordingId: "recording-oldest",
        songTitle: "Oldest Song",
      }),
    ];

    const { container } = renderRecordingsLibrary();

    expect(await screen.findByText("Newest Song")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Sort recordings"), {
      target: {
        value: "oldest",
      },
    });

    const dayGroups = Array.from(container.querySelectorAll(".recording-library-day-group"));

    expect(dayGroups[0].textContent).toContain("May 29, 2026");
    expect(dayGroups[0].textContent).toContain("Oldest Song");
    expect(dayGroups[1].textContent).toContain("May 31, 2026");
    expect(dayGroups[1].textContent).toContain("Newest Song");
  });

  it("sorts recordings by duration inside each date group", async () => {
    mockRecordingStorageState.recordings = [
      createRecording({
        createdAt: "2026-05-30T12:00:00.000Z",
        durationSeconds: 120,
        recordingId: "recording-long",
        songTitle: "Long Recording",
      }),
      createRecording({
        createdAt: "2026-05-30T13:00:00.000Z",
        durationSeconds: 30,
        recordingId: "recording-short",
        songTitle: "Short Recording",
      }),
    ];

    const { container } = renderRecordingsLibrary();

    expect(await screen.findByText("Long Recording")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Sort recordings"), {
      target: {
        value: "shortest",
      },
    });

    const cards = Array.from(container.querySelectorAll(".recording-library-card"));

    expect(cards[0].textContent).toContain("Short Recording");
    expect(cards[1].textContent).toContain("Long Recording");

    fireEvent.change(screen.getByLabelText("Sort recordings"), {
      target: {
        value: "longest",
      },
    });

    const resortedCards = Array.from(container.querySelectorAll(".recording-library-card"));

    expect(resortedCards[0].textContent).toContain("Long Recording");
    expect(resortedCards[1].textContent).toContain("Short Recording");
  });

  it("renders the recording card date and time with a dash separator", async () => {
    mockRecordingStorageState.recordings = [
      createRecording({
        createdAt: "2026-05-30T12:00:00.000Z",
        recordingId: "recording-date-format",
        songTitle: "Date Format Song",
      }),
    ];

    renderRecordingsLibrary();

    expect(await screen.findByText(/May 30, 2026 -/)).toBeTruthy();
  });

  it("adds a scrollable class after more than five visible recordings", async () => {
    mockRecordingStorageState.recordings = Array.from({ length: 6 }, (_, index) =>
      createRecording({
        createdAt: `2026-05-30T${String(index + 8).padStart(2, "0")}:00:00.000Z`,
        recordingId: `recording-${index}`,
        songTitle: `Recording ${index}`,
      }),
    );

    const { container } = renderRecordingsLibrary();

    expect(await screen.findByText("Recording 0")).toBeTruthy();
    expect(container.querySelector(".recording-library-day-group-list")?.className).toContain("is-scrollable");
  });

  it("renders an empty state when there are no local recordings", async () => {
    renderRecordingsLibrary();

    expect(await screen.findByText("No local recordings yet")).toBeTruthy();
    expect(screen.getByText(/Record a practice session from the Dashboard/)).toBeTruthy();
  });

  it("deletes a recording after confirmation and keeps session history external", async () => {
    mockRecordingStorageState.recordings = [
      createRecording({
        recordingId: "recording-linked",
        sessionId: "session-linked",
        songTitle: "Linked Song",
      }),
    ];

    renderRecordingsLibrary({
      sessions: [
        createSession({
          id: "session-linked",
          recordingId: "recording-linked",
          songTitle: "Linked Song",
        }),
      ],
    });

    fireEvent.click(await screen.findByLabelText("Delete recording for Linked Song"));

    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByText("Delete this recording?")).toBeTruthy();

    fireEvent.click(within(dialog).getByRole("button", { name: "Delete Recording" }));

    await waitFor(() => {
      expect(mockRecordingStorageState.deleteRecording).toHaveBeenCalledWith("recording-linked");
      expect(screen.getByText("Recording deleted. Session history kept.")).toBeTruthy();
    });

    expect(screen.queryByText("Linked Song")).toBeNull();
  });
});
