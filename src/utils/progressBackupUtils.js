import { STORAGE_VERSION } from "../constants";
import { createRecordingBackupRecords, restoreRecordingBackupRecords } from "./recordingExportUtils";
import { clearRecordings } from "./recordingStorageUtils";
import { createAppSettings, saveAppSettings } from "./settingsStorageUtils";
import { createStoredProgress, migrateStoredProgress, saveStoredProgress } from "./storageUtils";

const PROGRESS_BACKUP_TYPE = "guitar-journey-progress";
const PROGRESS_BACKUP_VERSION = 2;

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function createRecordingBackupEnvelope(recordings = []) {
  const safeRecordings = Array.isArray(recordings) ? recordings : [];

  return {
    included: safeRecordings.length > 0,
    count: safeRecordings.length,
    items: safeRecordings,
    note: safeRecordings.length
      ? "Practice recordings are included as base64 audio data and can be restored into IndexedDB on import."
      : "No practice recordings were found to include in this backup.",
  };
}

function createProgressBackup({ appSettings, exportedAt = new Date().toISOString(), progress, recordings = [] }) {
  return {
    backupType: PROGRESS_BACKUP_TYPE,
    backupVersion: PROGRESS_BACKUP_VERSION,
    exportedAt,
    storageVersion: STORAGE_VERSION,
    appSettings: createAppSettings(appSettings),
    progress: createStoredProgress(progress),
    recordings: createRecordingBackupEnvelope(recordings),
  };
}

async function createProgressBackupWithRecordings({ appSettings, exportedAt = new Date().toISOString(), progress }) {
  const recordings = await createRecordingBackupRecords();

  return createProgressBackup({
    appSettings,
    exportedAt,
    progress,
    recordings,
  });
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

  const recordingItems = Array.isArray(parsedValue.recordings?.items) ? parsedValue.recordings.items : [];

  return {
    backupType: PROGRESS_BACKUP_TYPE,
    backupVersion: Number(parsedValue.backupVersion) || PROGRESS_BACKUP_VERSION,
    exportedAt: parsedValue.exportedAt || "",
    storageVersion: Number(parsedValue.storageVersion) || STORAGE_VERSION,
    appSettings: createAppSettings(parsedValue.appSettings),
    progress: migrateStoredProgress(parsedValue.progress),
    recordings: isPlainObject(parsedValue.recordings)
      ? {
          included: Boolean(parsedValue.recordings.included || recordingItems.length),
          count: Number(parsedValue.recordings.count) || recordingItems.length,
          items: recordingItems,
          note: String(parsedValue.recordings.note || ""),
        }
      : createRecordingBackupEnvelope(),
  };
}

function getProgressBackupSummary(backup) {
  const parsedBackup = parseProgressBackup(backup);
  const progress = parsedBackup.progress;
  const customSongCount = progress.customSongs.length;
  const customGenreCount = progress.customGenres.length;
  const sessionCount = progress.sessionHistory.length;
  const recordingCount = parsedBackup.recordings.items.length;
  const recordingLabel = recordingCount ? ` • ${recordingCount} recording${recordingCount === 1 ? "" : "s"}` : "";

  return {
    backupType: parsedBackup.backupType,
    backupVersion: parsedBackup.backupVersion,
    exportedAt: parsedBackup.exportedAt,
    customGenreCount,
    customSongCount,
    recordingCount,
    sessionCount,
    label: `${sessionCount} session${sessionCount === 1 ? "" : "s"} • ${customSongCount} custom song${customSongCount === 1 ? "" : "s"} • ${customGenreCount} custom genre${
      customGenreCount === 1 ? "" : "s"
    }${recordingLabel}`,
  };
}

function applyProgressBackup(backup) {
  const parsedBackup = parseProgressBackup(backup);

  saveStoredProgress(parsedBackup.progress);
  saveAppSettings(parsedBackup.appSettings);

  return parsedBackup;
}

async function applyProgressBackupWithRecordings(backup) {
  const parsedBackup = applyProgressBackup(backup);

  await clearRecordings();

  const restoredRecordings = await restoreRecordingBackupRecords(parsedBackup.recordings.items);

  return {
    ...parsedBackup,
    restoredRecordingCount: restoredRecordings.length,
  };
}

export {
  PROGRESS_BACKUP_TYPE,
  PROGRESS_BACKUP_VERSION,
  applyProgressBackup,
  applyProgressBackupWithRecordings,
  createProgressBackup,
  createProgressBackupWithRecordings,
  getProgressBackupSummary,
  parseProgressBackup,
};
