import { getAllRecordings, getRecording, saveRecording } from "./recordingStorageUtils";

const RECORDING_BACKUP_DATA_ENCODING = "base64";

function sanitizeFilenamePart(value, fallback = "recording") {
  const cleanedValue = String(value || "")
    .trim()
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return cleanedValue || fallback;
}

function getRecordingFileExtension(mimeType = "") {
  const normalizedMimeType = String(mimeType || "").toLowerCase();

  if (normalizedMimeType.includes("mp4")) return "mp4";
  if (normalizedMimeType.includes("mpeg")) return "mp3";
  if (normalizedMimeType.includes("ogg")) return "ogg";
  if (normalizedMimeType.includes("wav")) return "wav";

  return "webm";
}

function getRecordingDownloadFilename(session = {}, recording = {}) {
  const songTitle = sanitizeFilenamePart(session.songTitle || recording.songTitle, "practice-recording");
  const completedDate = sanitizeFilenamePart(String(session.completedAt || recording.createdAt || new Date().toISOString()).slice(0, 10), "date");
  const extension = getRecordingFileExtension(recording.mimeType || session.recordingMimeType);

  return `guitar-journey-${songTitle}-${completedDate}.${extension}`;
}

function downloadBlobFile(filename, blob) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  window.URL.revokeObjectURL(url);
}

async function downloadRecordingForSession(session) {
  const recordingId = String(session?.recordingId || "").trim();

  if (!recordingId) {
    throw new Error("No recording is attached to this session.");
  }

  const recording = await getRecording(recordingId);

  if (!recording?.blob) {
    throw new Error("Recording audio could not be found on this device.");
  }

  const filename = getRecordingDownloadFilename(session, recording);

  downloadBlobFile(filename, recording.blob);

  return {
    filename,
    recording,
  };
}

async function blobToBase64(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);

    binary += String.fromCharCode(...chunk);
  }

  return window.btoa(binary);
}

function base64ToBlob(base64Data, mimeType = "") {
  const binary = window.atob(base64Data);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], {
    type: mimeType,
  });
}

async function createRecordingBackupRecord(recording) {
  if (!recording?.recordingId || !recording?.blob) return null;

  return {
    recordingId: recording.recordingId,
    sessionId: recording.sessionId || "",
    songId: recording.songId || "",
    songTitle: recording.songTitle || "",
    durationSeconds: Number(recording.durationSeconds) || 0,
    mimeType: recording.mimeType || recording.blob.type || "",
    createdAt: recording.createdAt || "",
    updatedAt: recording.updatedAt || "",
    dataEncoding: RECORDING_BACKUP_DATA_ENCODING,
    data: await blobToBase64(recording.blob),
  };
}

async function createRecordingBackupRecords() {
  const recordings = await getAllRecordings();
  const backupRecords = await Promise.all(recordings.map((recording) => createRecordingBackupRecord(recording)));

  return backupRecords.filter(Boolean);
}

function parseRecordingBackupRecord(record) {
  const recordingId = String(record?.recordingId || "").trim();
  const data = String(record?.data || "").trim();

  if (!recordingId || !data) return null;

  return {
    recordingId,
    sessionId: String(record.sessionId || ""),
    songId: String(record.songId || ""),
    songTitle: String(record.songTitle || ""),
    durationSeconds: Number(record.durationSeconds) || 0,
    mimeType: String(record.mimeType || ""),
    createdAt: String(record.createdAt || ""),
    updatedAt: String(record.updatedAt || ""),
    dataEncoding: record.dataEncoding === RECORDING_BACKUP_DATA_ENCODING ? RECORDING_BACKUP_DATA_ENCODING : RECORDING_BACKUP_DATA_ENCODING,
    data,
  };
}

async function restoreRecordingBackupRecord(record) {
  const parsedRecord = parseRecordingBackupRecord(record);

  if (!parsedRecord) return null;

  const blob = base64ToBlob(parsedRecord.data, parsedRecord.mimeType);

  return saveRecording(parsedRecord.recordingId, blob, {
    sessionId: parsedRecord.sessionId,
    songId: parsedRecord.songId,
    songTitle: parsedRecord.songTitle,
    durationSeconds: parsedRecord.durationSeconds,
    mimeType: parsedRecord.mimeType,
    createdAt: parsedRecord.createdAt || undefined,
    updatedAt: parsedRecord.updatedAt || undefined,
  });
}

async function restoreRecordingBackupRecords(records = []) {
  const safeRecords = Array.isArray(records) ? records : [];
  const restoredRecords = await Promise.all(safeRecords.map((record) => restoreRecordingBackupRecord(record)));

  return restoredRecords.filter(Boolean);
}

export {
  RECORDING_BACKUP_DATA_ENCODING,
  base64ToBlob,
  blobToBase64,
  createRecordingBackupRecord,
  createRecordingBackupRecords,
  downloadBlobFile,
  downloadRecordingForSession,
  getRecordingDownloadFilename,
  getRecordingFileExtension,
  parseRecordingBackupRecord,
  restoreRecordingBackupRecord,
  restoreRecordingBackupRecords,
  sanitizeFilenamePart,
};
