import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createProgressBackup } from "../../utils/progressBackupUtils";
import SettingsPanel from "../SettingsPanel";

const mockMicrophoneTestState = vi.hoisted(() => ({
  isTestingMicrophone: false,
  microphoneLevel: 0,
  microphoneTestMessage: "",
  startMicrophoneTest: vi.fn(),
  stopMicrophoneTest: vi.fn(),
}));

vi.mock("../../hooks", () => ({
  useMicrophoneTest: () => mockMicrophoneTestState,
}));

vi.mock("../../utils/audioRecordingUtils", () => ({
  getAudioRecordingSupportDetails: () => ({
    isSupported: true,
    supportedMimeType: "audio/webm;codecs=opus",
    supportedMimeTypeLabel: "audio/webm;codecs=opus",
  }),
}));

vi.mock("../../utils/recordingStorageUtils", () => ({
  getRecordingStorageSummary: () =>
    Promise.resolve({
      count: 2,
      isSupported: true,
      label: "2 recordings",
    }),
}));

function createProgress(overrides = {}) {
  return {
    selectedPath: "Blues",
    selectedSongId: "custom-song",
    sessionMinutes: 20,
    completedStepsBySong: {},
    masteredSongs: {},
    transitionScores: {},
    sessionHistory: [
      {
        id: "session-1",
        songId: "custom-song",
        songTitle: "Custom Song",
        minutes: 20,
        completedAt: "2026-05-30T12:00:00",
      },
      {
        id: "session-2",
        songId: "custom-song",
        songTitle: "Custom Song",
        minutes: 15,
        completedAt: "2026-05-31T12:00:00",
      },
    ],
    customSongs: [
      {
        id: "custom-song",
        title: "Custom Song",
        genre: "Blues",
        key: "G",
        difficulty: "Beginner",
        chords: ["G", "C"],
        transitions: ["G → C"],
        sections: [{ name: "Verse", progression: "G - C" }],
        strumming: "↓ · · · · · · ·",
        goal: "Practice custom song.",
      },
    ],
    customGenres: [
      {
        name: "R&B",
        description: "Syncopated feel.",
      },
      {
        name: "Electronica",
        description: "Synths and groove.",
      },
    ],
    ...overrides,
  };
}

function createFileWithText({ filename = "guitar-journey-progress.json", text }) {
  const file = new File([text], filename, {
    type: "application/json",
  });

  Object.defineProperty(file, "text", {
    value: vi.fn(() => Promise.resolve(text)),
  });

  return file;
}

function renderSettingsPanel(props = {}) {
  return render(
    <SettingsPanel
      appSettings={{
        themeMode: "light",
      }}
      onThemeModeChange={vi.fn()}
      {...props}
    />,
  );
}

describe("SettingsPanel", () => {
  beforeEach(() => {
    window.localStorage.clear();

    mockMicrophoneTestState.isTestingMicrophone = false;
    mockMicrophoneTestState.microphoneLevel = 0;
    mockMicrophoneTestState.microphoneTestMessage = "";
    mockMicrophoneTestState.startMicrophoneTest.mockReset();
    mockMicrophoneTestState.stopMicrophoneTest.mockReset();

    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:guitar-journey-progress"),
      revokeObjectURL: vi.fn(),
    });

    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("renders progress backup controls in the Storage section", async () => {
    renderSettingsPanel();

    expect(screen.getByText("Progress backup")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Import Progress" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Export Progress" })).toBeTruthy();
    expect(await screen.findByText("2 recordings")).toBeTruthy();
  });

  it("exports a JSON progress backup and shows a success message", async () => {
    renderSettingsPanel();

    fireEvent.click(screen.getByRole("button", { name: "Export Progress" }));

    await waitFor(() => {
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:guitar-journey-progress");
    });

    expect(screen.getByText("Progress backup exported. Recordings are not included yet.")).toBeTruthy();
  });

  it("shows a validation message for invalid import JSON", async () => {
    const { container } = renderSettingsPanel();
    const input = container.querySelector('input[type="file"]');
    const file = createFileWithText({
      text: "{not-json",
    });

    fireEvent.change(input, {
      target: {
        files: [file],
      },
    });

    expect(await screen.findByText("This backup file is not valid JSON.")).toBeTruthy();
  });

  it("shows an import confirmation dialog with a primary confirm button for valid backups", async () => {
    const backup = createProgressBackup({
      appSettings: {
        themeMode: "light",
      },
      exportedAt: "2026-05-30T12:00:00.000Z",
      progress: createProgress(),
    });

    const { container } = renderSettingsPanel();
    const input = container.querySelector('input[type="file"]');
    const file = createFileWithText({
      text: JSON.stringify(backup),
    });

    fireEvent.change(input, {
      target: {
        files: [file],
      },
    });

    const dialog = await screen.findByRole("dialog");

    expect(dialog).toBeTruthy();
    expect(within(dialog).getByText("Import progress backup?")).toBeTruthy();
    expect(within(dialog).getByText(/2 sessions • 1 custom song • 2 custom genres/)).toBeTruthy();

    const confirmButton = within(dialog).getByRole("button", {
      name: "Import Progress",
    });

    expect(confirmButton.className).toContain("confirm-dialog-confirm-button--primary");

    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("starts and stops the microphone test from Settings", () => {
    renderSettingsPanel();

    fireEvent.click(screen.getByRole("button", { name: "Test Microphone" }));

    expect(mockMicrophoneTestState.startMicrophoneTest).toHaveBeenCalled();
  });

  it("calls theme change handler when a theme option is selected", () => {
    const onThemeModeChange = vi.fn();

    renderSettingsPanel({
      onThemeModeChange,
    });

    fireEvent.click(screen.getByRole("button", { name: /Dark/ }));

    expect(onThemeModeChange).toHaveBeenCalledWith("dark");
  });
});
