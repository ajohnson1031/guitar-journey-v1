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
  getAllRecordings: () =>
    Promise.resolve([
      {
        blob: new Blob(["test audio"], { type: "audio/webm" }),
        createdAt: "2026-05-30T12:00:00.000Z",
        durationSeconds: 12,
        mimeType: "audio/webm",
        recordingId: "recording-test",
        sessionId: "session-test",
        songId: "song-test",
        songTitle: "Test Song",
      },
    ]),
  getRecordingStorageSummary: () =>
    Promise.resolve({
      count: 2,
      isSupported: true,
      label: "2 recordings",
    }),
  saveRecording: () =>
    Promise.resolve({
      recordingId: "recording-test",
    }),
}));

vi.mock("../../utils/progressBackupUtils", async () => {
  const actual = await vi.importActual("../../utils/progressBackupUtils");

  return {
    ...actual,
    createProgressBackupWithRecordings: vi.fn(async ({ appSettings, progress }) =>
      actual.createProgressBackup({
        appSettings,
        progress,
        recordings: [
          {
            recordingId: "recording-test",
            sessionId: "session-test",
            songId: "song-test",
            songTitle: "Test Song",
            durationSeconds: 12,
            mimeType: "audio/webm",
            createdAt: "2026-05-30T12:00:00.000Z",
            updatedAt: "2026-05-30T12:00:00.000Z",
            dataEncoding: "base64",
            data: window.btoa("test audio"),
          },
        ],
      }),
    ),
    applyProgressBackupWithRecordings: vi.fn(async (backup) => ({
      ...actual.applyProgressBackup(backup),
      restoredRecordingCount: 0,
    })),
  };
});

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

function createAppSettings(overrides = {}) {
  return {
    themeMode: "light",
    accentColor: "blue",
    audioInputSettings: {
      inputMode: "standard",
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    ...overrides,
  };
}

function renderSettingsPanel(props = {}) {
  return render(
    <SettingsPanel
      appSettings={createAppSettings()}
      onAccentColorChange={vi.fn()}
      onAudioInputModeChange={vi.fn()}
      onAudioInputSettingChange={vi.fn()}
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
    expect(screen.getByRole("button", { name: "Import" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Export" })).toBeTruthy();
    expect(await screen.findByText("2 recordings")).toBeTruthy();
  });

  it("exports a JSON progress backup and shows a success message", async () => {
    renderSettingsPanel();

    fireEvent.click(screen.getByRole("button", { name: /Export/ }));

    await waitFor(() => {
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:guitar-journey-progress");
    });

    expect(screen.getByText(/Progress backup exported/)).toBeTruthy();
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

  it("renders standard audio settings locked to safe defaults", () => {
    renderSettingsPanel();

    expect(screen.getByLabelText("Audio input settings")).toBeTruthy();
    expect(screen.getByText("Audio settings")).toBeTruthy();
    expect(screen.getByRole("group", { name: "Audio input mode" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Standard/ }).className).toContain("is-selected");
    expect(screen.getByText("Echo cancellation")).toBeTruthy();
    expect(screen.getByText("Noise suppression")).toBeTruthy();
    expect(screen.getByText("Auto gain control")).toBeTruthy();
    expect(screen.getAllByText("On by default")).toHaveLength(3);
    expect(screen.getAllByText("Locked in Standard")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Toggle Echo cancellation" }).disabled).toBe(true);
    expect(screen.getByText(/Advanced\/raw input mode can adjust browser audio processing/)).toBeTruthy();
  });

  it("allows audio mode changes and advanced audio setting toggles", () => {
    const onAudioInputModeChange = vi.fn();
    const onAudioInputSettingChange = vi.fn();

    renderSettingsPanel({
      appSettings: createAppSettings({
        audioInputSettings: {
          inputMode: "advanced",
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true,
        },
      }),
      onAudioInputModeChange,
      onAudioInputSettingChange,
    });

    expect(screen.getByRole("button", { name: /Advanced/ }).className).toContain("is-selected");
    expect(screen.getByRole("button", { name: "Toggle Noise suppression" }).disabled).toBe(false);
    expect(screen.getAllByText("Editable in Advanced")).toHaveLength(3);

    fireEvent.click(screen.getByRole("button", { name: /Standard/ }));
    expect(onAudioInputModeChange).toHaveBeenCalledWith("standard");

    fireEvent.click(screen.getByRole("button", { name: "Toggle Noise suppression" }));
    expect(onAudioInputSettingChange).toHaveBeenCalledWith("noiseSuppression", true);
  });

  it("starts the microphone test from Settings", () => {
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

  it("calls accent color change handler when an accent option is selected", () => {
    const onAccentColorChange = vi.fn();

    renderSettingsPanel({
      onAccentColorChange,
    });

    expect(screen.getByRole("group", { name: "Accent color" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Purple/ }));

    expect(onAccentColorChange).toHaveBeenCalledWith("purple");
  });
});
