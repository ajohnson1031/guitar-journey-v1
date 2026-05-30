const NOTE_TO_SEMITONE = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  "E#": 5,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
  Cb: 11,
  "B#": 0,
};

const SEMITONE_TO_NOTE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const DEFAULT_CHORD_SAMPLE_DURATION_SECONDS = 1.35;
const DEFAULT_CHORD_SAMPLE_VOLUME = 0.14;

let sharedAudioContext = null;

function normalizeNoteName(noteName) {
  const rawNoteName = String(noteName || "").trim();

  if (!rawNoteName) return "";

  const letter = rawNoteName.charAt(0).toUpperCase();
  const accidental = rawNoteName.slice(1, 2);

  if (!/[A-G]/.test(letter)) return "";

  if (accidental === "#" || accidental === "b") {
    return `${letter}${accidental}`;
  }

  return letter;
}

function getSemitoneForNote(noteName) {
  const normalizedNoteName = normalizeNoteName(noteName);

  if (!normalizedNoteName) return null;

  return NOTE_TO_SEMITONE[normalizedNoteName] ?? null;
}

function getNoteNameForSemitone(semitone) {
  const normalizedSemitone = ((Number(semitone) % 12) + 12) % 12;

  return SEMITONE_TO_NOTE[normalizedSemitone];
}

function getFrequencyForMidiNote(midiNote) {
  return 440 * 2 ** ((midiNote - 69) / 12);
}

function getFrequencyForNote(noteName, octave = 4) {
  const semitone = getSemitoneForNote(noteName);

  if (semitone === null) return null;

  const midiNote = 12 * (Number(octave) + 1) + semitone;

  return getFrequencyForMidiNote(midiNote);
}

function normalizeChordName(chordName) {
  return String(chordName || "")
    .trim()
    .replace(/[()]/g, "")
    .replace(/\s+/g, "");
}

function parseChordName(chordName) {
  const normalizedChordName = normalizeChordName(chordName);

  if (!normalizedChordName) return null;

  const [mainChord, slashBass] = normalizedChordName.split("/");
  const match = mainChord.match(/^([A-Ga-g](?:#|b)?)(.*)$/);

  if (!match) return null;

  const root = normalizeNoteName(match[1]);
  const quality = match[2] || "";
  const bass = slashBass ? normalizeNoteName(slashBass) : "";

  if (getSemitoneForNote(root) === null) return null;

  return {
    root,
    quality,
    bass: getSemitoneForNote(bass) === null ? "" : bass,
  };
}

function getChordToneOffsets(quality = "") {
  const normalizedQuality = String(quality || "").toLowerCase();

  if (normalizedQuality.includes("sus2")) return [0, 2, 7];
  if (normalizedQuality.includes("sus4") || normalizedQuality.includes("sus")) return [0, 5, 7];
  if (normalizedQuality.includes("dim")) return normalizedQuality.includes("7") ? [0, 3, 6, 9] : [0, 3, 6];
  if (normalizedQuality.includes("aug") || normalizedQuality.includes("+")) return [0, 4, 8];

  if (normalizedQuality.startsWith("m") && !normalizedQuality.startsWith("maj")) {
    if (normalizedQuality.includes("maj7")) return [0, 3, 7, 11];
    if (normalizedQuality.includes("7")) return [0, 3, 7, 10];

    return [0, 3, 7];
  }

  if (normalizedQuality.includes("maj7")) return [0, 4, 7, 11];
  if (normalizedQuality.includes("7")) return [0, 4, 7, 10];
  if (normalizedQuality.includes("6")) return [0, 4, 7, 9];
  if (normalizedQuality.includes("add9")) return [0, 4, 7, 14];

  return [0, 4, 7];
}

function createToneFromMidi(midiNote) {
  const semitone = ((midiNote % 12) + 12) % 12;

  return {
    note: getNoteNameForSemitone(semitone),
    midi: midiNote,
    frequency: getFrequencyForMidiNote(midiNote),
  };
}

function getChordTones(chordName) {
  const parsedChord = parseChordName(chordName);

  if (!parsedChord) return [];

  const rootSemitone = getSemitoneForNote(parsedChord.root);

  if (rootSemitone === null) return [];

  const rootMidi = 48 + rootSemitone;
  const offsets = getChordToneOffsets(parsedChord.quality);
  const tones = offsets.map((offset) => createToneFromMidi(rootMidi + offset));

  if (parsedChord.bass) {
    const bassSemitone = getSemitoneForNote(parsedChord.bass);
    const bassMidi = 36 + bassSemitone;
    const hasSameBass = tones.some((tone) => tone.midi === bassMidi);

    if (!hasSameBass) {
      return [createToneFromMidi(bassMidi), ...tones];
    }
  }

  return tones;
}

function getChordFrequencies(chordName) {
  return getChordTones(chordName).map((tone) => tone.frequency);
}

function getAudioContextConstructor() {
  if (typeof window === "undefined") return null;

  return window.AudioContext || window.webkitAudioContext || null;
}

function getAudioContext() {
  const AudioContextConstructor = getAudioContextConstructor();

  if (!AudioContextConstructor) return null;

  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContextConstructor();
  }

  return sharedAudioContext;
}

async function resumeAudioContext(audioContext) {
  if (!audioContext) return null;

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  return audioContext;
}

async function playChordSample(chordName, options = {}) {
  const audioContext = await resumeAudioContext(getAudioContext());
  const chordTones = getChordTones(chordName);

  if (!audioContext || !chordTones.length) return false;

  const durationSeconds = Number(options.durationSeconds) || DEFAULT_CHORD_SAMPLE_DURATION_SECONDS;
  const volume = Number(options.volume) || DEFAULT_CHORD_SAMPLE_VOLUME;
  const now = audioContext.currentTime;
  const masterGain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1800, now);
  filter.Q.setValueAtTime(0.8, now);

  masterGain.gain.setValueAtTime(0.0001, now);
  masterGain.gain.exponentialRampToValueAtTime(volume, now + 0.025);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

  filter.connect(masterGain);
  masterGain.connect(audioContext.destination);

  chordTones.forEach((tone, index) => {
    const oscillator = audioContext.createOscillator();
    const noteGain = audioContext.createGain();
    const startTime = now + index * 0.012;
    const stopTime = now + durationSeconds + 0.02;

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(tone.frequency, startTime);
    oscillator.detune.setValueAtTime(index % 2 === 0 ? -3 : 3, startTime);

    noteGain.gain.setValueAtTime(1 / Math.max(chordTones.length, 1), startTime);

    oscillator.connect(noteGain);
    noteGain.connect(filter);

    oscillator.start(startTime);
    oscillator.stop(stopTime);
  });

  return true;
}

export {
  DEFAULT_CHORD_SAMPLE_DURATION_SECONDS,
  DEFAULT_CHORD_SAMPLE_VOLUME,
  getChordFrequencies,
  getChordToneOffsets,
  getChordTones,
  getFrequencyForMidiNote,
  getFrequencyForNote,
  getNoteNameForSemitone,
  getSemitoneForNote,
  normalizeChordName,
  normalizeNoteName,
  parseChordName,
  playChordSample,
};
