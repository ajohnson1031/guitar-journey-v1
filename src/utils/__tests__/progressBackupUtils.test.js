import { describe, expect, it, vi } from "vitest";
import { STORAGE_VERSION } from "../../constants";
import {
  PROGRESS_BACKUP_TYPE,
  PROGRESS_BACKUP_VERSION,
  applyProgressBackup,
  createProgressBackup,
  getProgressBackupSummary,
  parseProgressBackup,
} from "../progressBackupUtils";
import { APP_SETTINGS_KEY } from "../settingsStorageUtils";

function createProgress(overrides = {}) {
  return {
    selectedPath: "Blues",
    selectedSongId: "custom-song",
    sessionMinutes: 30,
    completedStepsBySong: {
      "custom-song": {
        "Warm up": true,
      },
    },
    masteredSongs: {
      "custom-song": true,
    },
    transitionScores: {
      "G → C": 3,
    },
    sessionHistory: [
      {
        id: "session-1",
        songId: "custom-song",
        songTitle: "Custom Song",
        minutes: 20,
        completedAt: "2026-05-30T12:00:00",
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
    ],
    ...overrides,
  };
}

describe("progressBackupUtils", () => {
  it("creates a portable progress backup without recordings", () => {
    const backup = createProgressBackup({
      appSettings: { themeMode: "light" },
      exportedAt: "2026-05-30T12:00:00.000Z",
      progress: createProgress(),
    });

    expect(backup.backupType).toBe(PROGRESS_BACKUP_TYPE);
    expect(backup.backupVersion).toBe(PROGRESS_BACKUP_VERSION);
    expect(backup.storageVersion).toBe(STORAGE_VERSION);
    expect(backup.exportedAt).toBe("2026-05-30T12:00:00.000Z");
    expect(backup.appSettings.themeMode).toBe("light");
    expect(backup.progress.selectedPath).toBe("Blues");
    expect(backup.progress.customSongs).toHaveLength(1);
    expect(backup.progress.customGenres).toHaveLength(1);
    expect(backup.recordings.included).toBe(false);
  });

  it("parses and migrates a valid backup from JSON", () => {
    const backup = createProgressBackup({
      appSettings: { themeMode: "light" },
      progress: createProgress({
        sessionMinutes: "45",
      }),
    });

    const parsedBackup = parseProgressBackup(JSON.stringify(backup));

    expect(parsedBackup.backupType).toBe(PROGRESS_BACKUP_TYPE);
    expect(parsedBackup.appSettings.themeMode).toBe("light");
    expect(parsedBackup.progress.sessionMinutes).toBe(45);
    expect(parsedBackup.progress.storageVersion).toBe(STORAGE_VERSION);
    expect(parsedBackup.progress.customSongs[0].isCustom).toBe(true);
  });

  it("rejects invalid JSON and non-backup files", () => {
    expect(() => parseProgressBackup("{nope")).toThrow("This backup file is not valid JSON.");
    expect(() => parseProgressBackup({ hello: "world" })).toThrow("This file is not a Guitar Journey progress backup.");
    expect(() => parseProgressBackup({ backupType: PROGRESS_BACKUP_TYPE })).toThrow("This backup file is missing progress data.");
  });

  it("summarizes a backup before import", () => {
    const summary = getProgressBackupSummary(
      createProgressBackup({
        appSettings: { themeMode: "dark" },
        exportedAt: "2026-05-30T12:00:00.000Z",
        progress: createProgress(),
      }),
    );

    expect(summary.sessionCount).toBe(1);
    expect(summary.customSongCount).toBe(1);
    expect(summary.customGenreCount).toBe(1);
    expect(summary.recordingCount).toBe(0);
    expect(summary.label).toBe("1 session • 1 custom song • 1 custom genre");
  });

  it("applies imported progress and app settings to localStorage", () => {
    const setItemSpy = vi.spyOn(window.localStorage.__proto__, "setItem");
    const backup = createProgressBackup({
      appSettings: { themeMode: "light" },
      progress: createProgress(),
    });

    const parsedBackup = applyProgressBackup(backup);

    expect(parsedBackup.progress.selectedPath).toBe("Blues");
    expect(setItemSpy).toHaveBeenCalledWith("guitar-journey:v1:progress", expect.any(String));
    expect(setItemSpy).toHaveBeenCalledWith(APP_SETTINGS_KEY, expect.any(String));

    setItemSpy.mockRestore();
  });
});
