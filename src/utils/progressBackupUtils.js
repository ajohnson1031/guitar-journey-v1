import { STORAGE_VERSION } from "../constants";
import { createAppSettings, saveAppSettings } from "./settingsStorageUtils";
import { createStoredProgress, migrateStoredProgress, saveStoredProgress } from "./storageUtils";

const PROGRESS_BACKUP_TYPE = "guitar-journey-progress";
const PROGRESS_BACKUP_VERSION = 1;

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function createProgressBackup({ appSettings, exportedAt = new Date().toISOString(), progress }) {
  return {
    backupType: PROGRESS_BACKUP_TYPE,
    backupVersion: PROGRESS_BACKUP_VERSION,
    exportedAt,
    storageVersion: STORAGE_VERSION,
    appSettings: createAppSettings(appSettings),
    progress: createStoredProgress(progress),
    recordings: {
      included: false,
      note: "Practice recordings are stored separately in IndexedDB and are not included in this progress backup.",
    },
  };
}

function parseProgressBackup(value) {
  let parsedValue = value;

  if (typeof value === "string") {
    try {
      parsedValue = JSON.parse(value);
    } catch {
      throw new Error("This backup file is not valid JSON.");
    }
  }

  if (!isPlainObject(parsedValue)) {
    throw new Error("This backup file does not contain a valid Guitar Journey backup.");
  }

  if (parsedValue.backupType !== PROGRESS_BACKUP_TYPE) {
    throw new Error("This file is not a Guitar Journey progress backup.");
  }

  if (!isPlainObject(parsedValue.progress)) {
    throw new Error("This backup file is missing progress data.");
  }

  return {
    backupType: PROGRESS_BACKUP_TYPE,
    backupVersion: Number(parsedValue.backupVersion) || PROGRESS_BACKUP_VERSION,
    exportedAt: parsedValue.exportedAt || "",
    storageVersion: Number(parsedValue.storageVersion) || STORAGE_VERSION,
    appSettings: createAppSettings(parsedValue.appSettings),
    progress: migrateStoredProgress(parsedValue.progress),
    recordings: isPlainObject(parsedValue.recordings)
      ? {
          included: Boolean(parsedValue.recordings.included),
          note: String(parsedValue.recordings.note || ""),
        }
      : {
          included: false,
          note: "",
        },
  };
}

function getProgressBackupSummary(backup) {
  const parsedBackup = parseProgressBackup(backup);
  const progress = parsedBackup.progress;
  const customSongCount = progress.customSongs.length;
  const customGenreCount = progress.customGenres.length;
  const sessionCount = progress.sessionHistory.length;

  return {
    backupType: parsedBackup.backupType,
    backupVersion: parsedBackup.backupVersion,
    exportedAt: parsedBackup.exportedAt,
    customGenreCount,
    customSongCount,
    sessionCount,
    label: `${sessionCount} session${sessionCount === 1 ? "" : "s"} • ${customSongCount} custom song${customSongCount === 1 ? "" : "s"} • ${customGenreCount} custom genre${
      customGenreCount === 1 ? "" : "s"
    }`,
  };
}

function applyProgressBackup(backup) {
  const parsedBackup = parseProgressBackup(backup);

  saveStoredProgress(parsedBackup.progress);
  saveAppSettings(parsedBackup.appSettings);

  return parsedBackup;
}

export {
  PROGRESS_BACKUP_TYPE,
  PROGRESS_BACKUP_VERSION,
  applyProgressBackup,
  createProgressBackup,
  getProgressBackupSummary,
  parseProgressBackup,
};
