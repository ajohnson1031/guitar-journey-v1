import { requestAudioRecordingStream, stopMediaStreamTracks } from "./audioRecordingUtils";

const DEFAULT_MICROPHONE_TEST_DURATION_MS = 5000;
const DEFAULT_MICROPHONE_LEVEL_BAR_COUNT = 10;
const MICROPHONE_NOISE_FLOOR = 0.012;
const MICROPHONE_SIGNAL_RANGE = 0.18;

function getAudioContextConstructor() {
  if (typeof window === "undefined") return null;

  return window.AudioContext || window.webkitAudioContext || null;
}

function normalizeMicrophoneLevel(value) {
  const level = Number(value);

  if (!Number.isFinite(level) || level <= 0) return 0;
  if (level >= 1) return 1;

  return level;
}

function isUninitializedTimeDomainData(dataArray) {
  if (!dataArray?.length) return true;

  let hasNonZeroSample = false;
  let hasNonSilenceSample = false;

  for (let index = 0; index < dataArray.length; index += 1) {
    const sample = dataArray[index];

    if (sample !== 0) {
      hasNonZeroSample = true;
    }

    if (sample !== 128) {
      hasNonSilenceSample = true;
    }

    if (hasNonZeroSample && hasNonSilenceSample) {
      return false;
    }
  }

  return !hasNonZeroSample;
}

function getTimeDomainRmsLevel(dataArray) {
  if (!dataArray?.length || isUninitializedTimeDomainData(dataArray)) return 0;

  let sumSquares = 0;

  for (let index = 0; index < dataArray.length; index += 1) {
    const centeredSample = (dataArray[index] - 128) / 128;

    sumSquares += centeredSample * centeredSample;
  }

  return Math.sqrt(sumSquares / dataArray.length);
}

function getMicrophoneLevelFromTimeDomainData(dataArray) {
  const rmsLevel = getTimeDomainRmsLevel(dataArray);
  const adjustedLevel = (rmsLevel - MICROPHONE_NOISE_FLOOR) / MICROPHONE_SIGNAL_RANGE;

  return normalizeMicrophoneLevel(adjustedLevel);
}

function getLevelBarStates(level, barCount = DEFAULT_MICROPHONE_LEVEL_BAR_COUNT) {
  const safeBarCount = Math.max(1, Math.round(Number(barCount) || DEFAULT_MICROPHONE_LEVEL_BAR_COUNT));
  const normalizedLevel = normalizeMicrophoneLevel(level);
  const activeBarCount = normalizedLevel > 0 ? Math.max(1, Math.ceil(normalizedLevel * safeBarCount)) : 0;

  return Array.from({ length: safeBarCount }, (_, index) => index < activeBarCount);
}

async function createMicrophoneTestSession(audioConstraints = true) {
  const AudioContextConstructor = getAudioContextConstructor();

  if (!AudioContextConstructor) {
    throw new Error("Web Audio microphone testing is not supported in this browser.");
  }

  const stream = await requestAudioRecordingStream(audioConstraints);
  const audioContext = new AudioContextConstructor();

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  const analyser = audioContext.createAnalyser();

  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.35;

  const source = audioContext.createMediaStreamSource(stream);
  const dataArray = new Uint8Array(analyser.fftSize);

  dataArray.fill(128);
  source.connect(analyser);

  function readLevel() {
    analyser.getByteTimeDomainData(dataArray);

    return getMicrophoneLevelFromTimeDomainData(dataArray);
  }

  async function stop() {
    try {
      source.disconnect();
    } catch {
      // Source may already be disconnected.
    }

    stopMediaStreamTracks(stream);

    if (audioContext.state !== "closed") {
      await audioContext.close();
    }
  }

  return {
    audioContext,
    analyser,
    readLevel,
    source,
    stop,
    stream,
  };
}

export {
  DEFAULT_MICROPHONE_LEVEL_BAR_COUNT,
  DEFAULT_MICROPHONE_TEST_DURATION_MS,
  MICROPHONE_NOISE_FLOOR,
  MICROPHONE_SIGNAL_RANGE,
  createMicrophoneTestSession,
  getAudioContextConstructor,
  getLevelBarStates,
  getMicrophoneLevelFromTimeDomainData,
  getTimeDomainRmsLevel,
  isUninitializedTimeDomainData,
  normalizeMicrophoneLevel,
};
