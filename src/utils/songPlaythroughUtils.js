const NOTE_OFFSETS = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
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
};

const CHORD_TOKEN_REGEX = /\b[A-G](?:#|b)?(?:(?:maj|min|dim|aug|sus|add|m)?\d*)?(?:\/[A-G](?:#|b)?)?\b/g;

function getFrequencyFromMidiNote(midiNote) {
  return 440 * 2 ** ((midiNote - 69) / 12);
}

export function getSafePlaybackBpm(value) {
  const bpm = Number(value);

  if (!Number.isFinite(bpm) || bpm <= 0) return 72;

  return Math.min(220, Math.max(40, Math.round(bpm)));
}

export function parseProgressionToChords(progression = "") {
  const matches = String(progression || "").match(CHORD_TOKEN_REGEX);

  if (!matches) return [];

  return matches.map((chord) => chord.trim()).filter(Boolean);
}

function getChordRoot(chord) {
  const match = String(chord || "").trim().match(/^([A-G](?:#|b)?)/);

  return match?.[1] || "";
}

function getChordQuality(chord) {
  const cleanedChord = String(chord || "").trim();
  const root = getChordRoot(cleanedChord);

  return cleanedChord.slice(root.length).toLowerCase();
}

function getChordIntervals(chord) {
  const quality = getChordQuality(chord);

  if (quality.includes("dim")) return [0, 3, 6];
  if (quality.includes("sus2")) return [0, 2, 7];
  if (quality.includes("sus4") || quality.includes("sus")) return [0, 5, 7];
  if (quality.includes("5")) return [0, 7, 12];

  const isMinor = quality.startsWith("m") && !quality.startsWith("maj");
  const intervals = isMinor ? [0, 3, 7] : [0, 4, 7];

  if (quality.includes("maj7")) {
    intervals.push(11);
  } else if (/7|9|11|13/.test(quality)) {
    intervals.push(10);
  }

  if (/9|11|13/.test(quality)) {
    intervals.push(14);
  }

  return intervals.slice(0, 4);
}

export function getChordFrequencies(chord) {
  const root = getChordRoot(chord);
  const rootOffset = NOTE_OFFSETS[root];

  if (rootOffset === undefined) return [];

  const rootMidiNote = 48 + rootOffset;
  const intervals = getChordIntervals(chord);

  return intervals.map((interval) => Number(getFrequencyFromMidiNote(rootMidiNote + interval).toFixed(2)));
}

export function createPlaythroughSteps(song) {
  const sections = Array.isArray(song?.sections) ? song.sections : [];
  const steps = sections.flatMap((section, sectionIndex) => {
    const sectionName = section?.name || `Section ${sectionIndex + 1}`;
    const chords = parseProgressionToChords(section?.progression);

    return chords.map((chord, chordIndex) => ({
      chord,
      chordIndex,
      sectionIndex,
      sectionName,
    }));
  });

  if (steps.length) return steps;

  const fallbackChords = Array.isArray(song?.chords) ? song.chords.filter(Boolean) : [];

  return fallbackChords.map((chord, chordIndex) => ({
    chord,
    chordIndex,
    sectionIndex: 0,
    sectionName: "Song",
  }));
}
