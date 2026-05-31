import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import * as React from "react";
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

  it("renders linked and orphaned local recordings", async () => {
    mockRecordingStorageState.recordings = [
      createRecording({
        recordingId: "recording-linked",
        sessionId: "session-linked",
        songTitle: "Stored Linked Title",
      }),
      createRecording({
        recordingId: "recording-orphaned",
        sessionId: "session-orphaned",
        songTitle: "Orphaned Song",
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

    expect(await screen.findByText("Linked Song")).toBeTruthy();
    expect(screen.getByText("Orphaned Song")).toBeTruthy();
    expect(screen.getByText("Linked")).toBeTruthy();
    expect(screen.getByText("Orphaned")).toBeTruthy();
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
