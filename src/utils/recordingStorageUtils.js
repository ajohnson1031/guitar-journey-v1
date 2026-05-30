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
    updatedAt: new Date().toISOString(),
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

async function countRecordings() {
  if (!isRecordingStorageSupported()) return 0;

  return withRecordingStore("readonly", (store) => requestToPromise(store.count()));
}

async function getRecordingStorageSummary() {
  const isSupported = isRecordingStorageSupported();

  if (!isSupported) {
    return {
      count: 0,
      isSupported,
      label: "IndexedDB unavailable",
    };
  }

  const count = await countRecordings();

  return {
    count,
    isSupported,
    label: formatRecordingCount(count),
  };
}

async function deleteRecording(recordingId) {
  const normalizedRecordingId = String(recordingId || "").trim();

  if (!normalizedRecordingId) return false;

  await withRecordingStore("readwrite", (store) => requestToPromise(store.delete(normalizedRecordingId)));

  return true;
}

async function clearRecordings() {
  await withRecordingStore("readwrite", (store) => requestToPromise(store.clear()));

  return true;
}

export {
  RECORDINGS_DB_NAME,
  RECORDINGS_DB_VERSION,
  RECORDINGS_STORE_NAME,
  clearRecordings,
  countRecordings,
  createRecordingRecord,
  deleteRecording,
  formatRecordingCount,
  formatRecordingDuration,
  getRecording,
  getRecordingStorageSummary,
  isRecordingStorageSupported,
  normalizeRecordingDurationSeconds,
  normalizeRecordingMetadata,
  openRecordingDatabase,
  saveRecording,
};
