const RECORDINGS_DB_NAME = "guitar-journey-recordings";
const RECORDINGS_DB_VERSION = 1;
const RECORDINGS_STORE_NAME = "recordings";

function isRecordingStorageSupported() {
  return Boolean(typeof window !== "undefined" && window.indexedDB);
}

function normalizeRecordingDurationSeconds(value) {
  const durationSeconds = Number(value);

  if (!Number.isFinite(durationSeconds) || durationSeconds < 0) return 0;

  return Math.round(durationSeconds);
}

function normalizeRecordingMetadata(metadata = {}) {
  return {
    ...metadata,
    durationSeconds: normalizeRecordingDurationSeconds(metadata.durationSeconds),
    mimeType: String(metadata.mimeType || "").trim(),
  };
}

function formatRecordingDuration(totalSeconds) {
  const safeSeconds = normalizeRecordingDurationSeconds(totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatRecordingCount(count) {
  const safeCount = Math.max(0, Math.round(Number(count) || 0));

  return `${safeCount} ${safeCount === 1 ? "recording" : "recordings"}`;
}

function getSessionRecordingIds(sessionHistory = []) {
  return new Set(
    (Array.isArray(sessionHistory) ? sessionHistory : [])
      .map((session) => String(session?.recordingId || "").trim())
      .filter(Boolean),
  );
}

function createRecordingRecord(recordingId, blob, metadata = {}) {
  const normalizedRecordingId = String(recordingId || "").trim();

  if (!normalizedRecordingId) {
    throw new Error("Recording ID is required.");
  }

  if (!blob) {
    throw new Error("Recording blob is required.");
  }

  const normalizedMetadata = normalizeRecordingMetadata({
    ...metadata,
    mimeType: metadata.mimeType || blob.type || "",
  });
  const createdAt = metadata.createdAt || new Date().toISOString();

  return {
    ...normalizedMetadata,
    recordingId: normalizedRecordingId,
    blob,
    createdAt,
    updatedAt: metadata.updatedAt || new Date().toISOString(),
  };
}

function createUnsupportedStorageError() {
  return new Error("IndexedDB recording storage is not available in this browser.");
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error("IndexedDB request failed."));
    };
  });
}

function openRecordingDatabase() {
  if (!isRecordingStorageSupported()) {
    return Promise.reject(createUnsupportedStorageError());
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(RECORDINGS_DB_NAME, RECORDINGS_DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(RECORDINGS_STORE_NAME)) {
        database.createObjectStore(RECORDINGS_STORE_NAME, {
          keyPath: "recordingId",
        });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error("Could not open recording database."));
    };
  });
}

async function withRecordingStore(mode, callback) {
  const database = await openRecordingDatabase();

  try {
    const transaction = database.transaction(RECORDINGS_STORE_NAME, mode);
    const store = transaction.objectStore(RECORDINGS_STORE_NAME);
    const result = await callback(store);

    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Recording transaction failed."));
      transaction.onabort = () => reject(transaction.error || new Error("Recording transaction aborted."));
    });

    return result;
  } finally {
    database.close();
  }
}

async function saveRecording(recordingId, blob, metadata = {}) {
  const record = createRecordingRecord(recordingId, blob, metadata);

  await withRecordingStore("readwrite", (store) => requestToPromise(store.put(record)));

  return record;
}

async function getRecording(recordingId) {
  const normalizedRecordingId = String(recordingId || "").trim();

  if (!normalizedRecordingId) return null;

  return withRecordingStore("readonly", (store) => requestToPromise(store.get(normalizedRecordingId)));
}

async function getAllRecordings() {
  if (!isRecordingStorageSupported()) return [];

  return withRecordingStore("readonly", (store) => requestToPromise(store.getAll()));
}

async function countRecordings() {
  if (!isRecordingStorageSupported()) return 0;

  return withRecordingStore("readonly", (store) => requestToPromise(store.count()));
}

function getRecordingSummaryLabel({ linkedStoredCount, missingLinkedCount, orphanedCount, storedCount }) {
  if (!storedCount && !missingLinkedCount) {
    return "0 recordings";
  }

  if (!orphanedCount && !missingLinkedCount) {
    return formatRecordingCount(linkedStoredCount);
  }

  const parts = [`${linkedStoredCount} linked`];

  if (orphanedCount) {
    parts.push(`${orphanedCount} orphaned`);
  }

  if (missingLinkedCount) {
    parts.push(`${missingLinkedCount} missing`);
  }

  return parts.join(" • ");
}

async function getRecordingStorageSummary(sessionHistory = []) {
  const isSupported = isRecordingStorageSupported();

  if (!isSupported) {
    return {
      count: 0,
      isSupported,
      label: "IndexedDB unavailable",
      linkedStoredCount: 0,
      missingLinkedCount: 0,
      orphanedCount: 0,
      storedCount: 0,
    };
  }

  const recordings = await getAllRecordings();
  const linkedRecordingIds = getSessionRecordingIds(sessionHistory);
  const storedRecordingIds = new Set(recordings.map((recording) => String(recording?.recordingId || "").trim()).filter(Boolean));

  let linkedStoredCount = 0;
  let missingLinkedCount = 0;
  let orphanedCount = 0;

  linkedRecordingIds.forEach((recordingId) => {
    if (storedRecordingIds.has(recordingId)) {
      linkedStoredCount += 1;
    } else {
      missingLinkedCount += 1;
    }
  });

  storedRecordingIds.forEach((recordingId) => {
    if (!linkedRecordingIds.has(recordingId)) {
      orphanedCount += 1;
    }
  });

  const storedCount = storedRecordingIds.size;

  return {
    count: storedCount,
    isSupported,
    label: getRecordingSummaryLabel({
      linkedStoredCount,
      missingLinkedCount,
      orphanedCount,
      storedCount,
    }),
    linkedStoredCount,
    missingLinkedCount,
    orphanedCount,
    storedCount,
  };
}

async function deleteRecording(recordingId) {
  const normalizedRecordingId = String(recordingId || "").trim();

  if (!normalizedRecordingId) return false;

  await withRecordingStore("readwrite", (store) => requestToPromise(store.delete(normalizedRecordingId)));

  return true;
}

async function clearRecordings() {
  if (!isRecordingStorageSupported()) return false;

  await withRecordingStore("readwrite", (store) => requestToPromise(store.clear()));

  return true;
}

async function clearUnlinkedRecordings(sessionHistory = []) {
  const linkedRecordingIds = getSessionRecordingIds(sessionHistory);
  const recordings = await getAllRecordings();
  const unlinkedRecordingIds = recordings
    .map((recording) => String(recording?.recordingId || "").trim())
    .filter((recordingId) => recordingId && !linkedRecordingIds.has(recordingId));

  await Promise.all(unlinkedRecordingIds.map((recordingId) => deleteRecording(recordingId)));

  return unlinkedRecordingIds.length;
}

export {
  RECORDINGS_DB_NAME,
  RECORDINGS_DB_VERSION,
  RECORDINGS_STORE_NAME,
  clearRecordings,
  clearUnlinkedRecordings,
  countRecordings,
  createRecordingRecord,
  deleteRecording,
  formatRecordingCount,
  formatRecordingDuration,
  getAllRecordings,
  getRecording,
  getRecordingStorageSummary,
  getRecordingSummaryLabel,
  getSessionRecordingIds,
  isRecordingStorageSupported,
  normalizeRecordingDurationSeconds,
  normalizeRecordingMetadata,
  openRecordingDatabase,
  saveRecording,
};
