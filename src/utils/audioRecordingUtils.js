const RECORDING_MIME_TYPE_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/ogg",
  "audio/mp4",
];

function getMediaRecorderConstructor() {
  if (typeof window === "undefined") return null;

  return window.MediaRecorder || null;
}

function getSupportedRecordingMimeType() {
  const MediaRecorderConstructor = getMediaRecorderConstructor();

  if (!MediaRecorderConstructor?.isTypeSupported) return "";

  return RECORDING_MIME_TYPE_CANDIDATES.find((mimeType) => MediaRecorderConstructor.isTypeSupported(mimeType)) || "";
}

function isAudioRecordingSupported() {
  return Boolean(
    typeof window !== "undefined" &&
      getMediaRecorderConstructor() &&
      navigator?.mediaDevices?.getUserMedia,
  );
}

async function requestAudioRecordingStream(audioConstraints = true) {
  if (!isAudioRecordingSupported()) {
    throw new Error("Audio recording is not supported in this browser.");
  }

  return navigator.mediaDevices.getUserMedia({
    audio: audioConstraints,
  });
}

function createAudioRecorder(stream, options = {}) {
  const MediaRecorderConstructor = getMediaRecorderConstructor();

  if (!MediaRecorderConstructor) {
    throw new Error("MediaRecorder is not supported in this browser.");
  }

  const supportedMimeType = options.mimeType || getSupportedRecordingMimeType();
  const recorderOptions = supportedMimeType ? { mimeType: supportedMimeType } : undefined;

  return new MediaRecorderConstructor(stream, recorderOptions);
}

function stopMediaStreamTracks(stream) {
  if (!stream?.getTracks) return;

  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

function createRecordingId(prefix = "recording") {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function canPauseMediaRecorder(mediaRecorder) {
  return Boolean(mediaRecorder && typeof mediaRecorder.pause === "function" && typeof mediaRecorder.resume === "function");
}

function pauseMediaRecorder(mediaRecorder) {
  if (!mediaRecorder || mediaRecorder.state !== "recording") return false;

  if (!canPauseMediaRecorder(mediaRecorder)) return false;

  mediaRecorder.pause();

  return true;
}

function resumeMediaRecorder(mediaRecorder) {
  if (!mediaRecorder || mediaRecorder.state !== "paused") return false;

  if (!canPauseMediaRecorder(mediaRecorder)) return false;

  mediaRecorder.resume();

  return true;
}

export {
  RECORDING_MIME_TYPE_CANDIDATES,
  canPauseMediaRecorder,
  createAudioRecorder,
  createRecordingId,
  getMediaRecorderConstructor,
  getSupportedRecordingMimeType,
  isAudioRecordingSupported,
  pauseMediaRecorder,
  requestAudioRecordingStream,
  resumeMediaRecorder,
  stopMediaStreamTracks,
};
