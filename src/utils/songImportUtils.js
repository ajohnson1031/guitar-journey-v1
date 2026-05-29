import { KEY_OPTIONS } from "../constants";

const SECTION_LABELS = ["intro", "verse", "pre-chorus", "pre chorus", "chorus", "bridge", "interlude", "solo", "guitar solo", "outro", "tag"];

const CHORD_PATTERN =
  /(^|[\s|()[\]{}:])([A-G](?:#|b)?)(maj7|maj9|maj|min7|min9|min|m7b5|m7|m9|m6|m|dim7|dim|sus2|sus4|sus|add9|7sus4|7sus|13|11|9|7|6|5)?(?:\/([A-G](?:#|b)?))?(?=$|[\s|()[\]{}:.,;!?])/g;

const NOTE_VALUES = {
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

const MAJOR_SCALE_DEGREES = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE_DEGREES = [0, 2, 3, 5, 7, 8, 10];
const HARMONIC_MINOR_EXTRA_DEGREES = [11];

function normalizeQuality(quality) {
  const normalized = String(quality || "").trim();

  const aliases = {
    maj: "",
    min: "m",
    min7: "m7",
    min9: "m9",
    sus: "sus4",
    "7sus": "sus4",
    "7sus4": "sus4",
  };

  return aliases[normalized] ?? normalized;
}

function normalizeChord(chord) {
  const value = String(chord || "").trim();
  const match = value.match(/^([A-G](?:#|b)?)(.*)$/);

  if (!match) return "";

  const root = match[1];
  const rest = match[2] || "";
  const slashIndex = rest.indexOf("/");
  const quality = slashIndex >= 0 ? rest.slice(0, slashIndex) : rest;
  const slash = slashIndex >= 0 ? rest.slice(slashIndex) : "";

  return `${root}${normalizeQuality(quality)}${slash}`;
}

function isLikelyChord(value) {
  const normalized = String(value || "").trim();

  if (!normalized) return false;

  return /^[A-G](?:#|b)?(?:maj7|maj9|maj|min7|min9|min|m7b5|m7|m9|m6|m|dim7|dim|sus2|sus4|sus|add9|7sus4|7sus|13|11|9|7|6|5)?(?:\/[A-G](?:#|b)?)?$/.test(normalized);
}

function uniqueInOrder(values, limit = 24) {
  const seen = new Set();
  const output = [];

  for (const value of values) {
    const normalized = normalizeChord(value);

    if (!normalized) continue;

    const key = normalized.toLowerCase();

    if (seen.has(key)) continue;

    seen.add(key);
    output.push(normalized);

    if (output.length >= limit) break;
  }

  return output;
}

function getSectionNameFromLine(line) {
  const cleaned = String(line || "")
    .toLowerCase()
    .replace(/[[\]():]/g, "")
    .trim();

  return SECTION_LABELS.find((label) => cleaned === label || cleaned.startsWith(`${label} `));
}

function normalizeBracketedText(line) {
  return String(line || "").replace(/\[([^\]]+)\]/g, (_, content) => {
    const sectionName = getSectionNameFromLine(content);

    if (sectionName) return " ";

    return ` ${content} `;
  });
}

function extractChordsFromLine(line) {
  const chords = [];
  const normalizedLine = normalizeBracketedText(line).replace(/[|()]/g, " ");

  for (const match of normalizedLine.matchAll(CHORD_PATTERN)) {
    const root = match[2] || "";
    const quality = match[3] || "";
    const slashRoot = match[4] ? `/${match[4]}` : "";
    const chord = normalizeChord(`${root}${quality}${slashRoot}`);

    if (isLikelyChord(chord)) {
      chords.push(chord);
    }
  }

  return chords;
}

export function extractChordsFromSongText(text) {
  const chords = [];

  String(text || "")
    .split("\n")
    .forEach((line) => {
      chords.push(...extractChordsFromLine(line));
    });

  return chords;
}

function createTransitionList(chordSequence) {
  const transitions = [];
  const seen = new Set();

  for (let index = 0; index < chordSequence.length - 1; index += 1) {
    const from = chordSequence[index];
    const to = chordSequence[index + 1];

    if (!from || !to || from === to) continue;

    const transition = `${from} → ${to}`;
    const key = transition.toLowerCase();

    if (seen.has(key)) continue;

    seen.add(key);
    transitions.push(transition);

    if (transitions.length >= 16) break;
  }

  return transitions;
}

function titleCaseSectionName(value) {
  return String(value || "Section")
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function createSectionKey(section) {
  return `${String(section.name || "").toLowerCase()}::${String(section.progression || "").toLowerCase()}`;
}

function dedupeSectionsByNameAndProgression(sections) {
  const seen = new Set();
  const output = [];

  for (const section of sections) {
    if (!section.name || !section.progression) continue;

    const key = createSectionKey(section);

    if (seen.has(key)) continue;

    seen.add(key);
    output.push(section);
  }

  return output;
}

export function extractSectionsFromSongText(text) {
  const lines = String(text || "").split("\n");
  const sections = [];
  let currentSection = null;

  for (const line of lines) {
    const sectionLabel = getSectionNameFromLine(line);

    if (sectionLabel) {
      if (currentSection?.chords?.length) {
        sections.push(currentSection);
      }

      currentSection = {
        name: titleCaseSectionName(sectionLabel),
        chords: [],
      };

      continue;
    }

    const chords = extractChordsFromLine(line);

    if (!chords.length) continue;

    if (!currentSection) {
      currentSection = {
        name: "Main",
        chords: [],
      };
    }

    currentSection.chords.push(...chords);
  }

  if (currentSection?.chords?.length) {
    sections.push(currentSection);
  }

  const normalizedSections = sections.map((section) => ({
    name: section.name,
    progression: uniqueInOrder(section.chords, 12).join(" - "),
  }));

  const dedupedSections = dedupeSectionsByNameAndProgression(normalizedSections);

  if (dedupedSections.length) return dedupedSections;

  const allChords = uniqueInOrder(extractChordsFromSongText(text), 8);

  if (allChords.length) {
    return [
      {
        name: "Main",
        progression: allChords.join(" - "),
      },
    ];
  }

  return [];
}

function estimateDifficulty(chords) {
  const uniqueChords = uniqueInOrder(chords, 48);
  const advancedChordCount = uniqueChords.filter((chord) => /(maj7|maj9|m7b5|dim|dim7|sus2|sus4|add9|13|11|9|7|6|#|b)/.test(chord)).length;

  if (uniqueChords.length <= 4 && advancedChordCount === 0) {
    return "Beginner";
  }

  if (uniqueChords.length <= 7 && advancedChordCount <= 2) {
    return "Intermediate";
  }

  if (uniqueChords.length <= 10) {
    return "Advanced";
  }

  return "Expert";
}

function createPracticeGoal({ chords, transitions, sections }) {
  const firstSection = sections[0];
  const firstTransition = transitions[0];

  if (firstSection && firstTransition) {
    return `Build clean chord changes, steady timing, and a confident ${firstSection.name.toLowerCase()} using ${firstTransition}.`;
  }

  if (chords.length) {
    return `Build clean chord changes and steady timing across ${chords.slice(0, 4).join(", ")}.`;
  }

  return "Build clean chord changes, steady timing, and a confident song playthrough.";
}

function getChordRoot(chord) {
  const match = String(chord || "").match(/^([A-G](?:#|b)?)/);

  return match ? match[1] : "";
}

function getChordQuality(chord) {
  const withoutSlash = String(chord || "").split("/")[0];
  const match = withoutSlash.match(/^[A-G](?:#|b)?(.*)$/);

  return match ? match[1] || "" : "";
}

function isMinorChord(chord) {
  return /^m(?!aj)/i.test(getChordQuality(chord));
}

function isDominantChord(chord) {
  const quality = getChordQuality(chord);

  return /7/i.test(quality) && !/maj7/i.test(quality);
}

function getNoteValue(note) {
  return NOTE_VALUES[note];
}

function getKeyRootFromOption(keyOption) {
  const match = String(keyOption || "").match(/^([A-G](?:#|b)?)/);

  return match ? match[1] : "";
}

function isMinorKeyOption(keyOption) {
  const value = String(keyOption || "").trim();

  return /m$/i.test(value) || /minor/i.test(value);
}

function getKeyName(rootValue, mode) {
  const matchingOption = KEY_OPTIONS.find((keyOption) => {
    const optionRoot = getKeyRootFromOption(keyOption);
    const optionRootValue = NOTE_VALUES[optionRoot];

    if (optionRootValue !== rootValue) return false;

    return mode === "minor" ? isMinorKeyOption(keyOption) : !isMinorKeyOption(keyOption);
  });

  if (matchingOption) return matchingOption;

  return "";
}

function getScaleDegree(rootValue, keyRootValue) {
  return (rootValue - keyRootValue + 12) % 12;
}

function scoreMajorKey(chordSequence, keyRootValue) {
  let score = 0;

  chordSequence.forEach((chord, index) => {
    const root = getChordRoot(chord);
    const rootValue = getNoteValue(root);

    if (rootValue === undefined) return;

    const degree = getScaleDegree(rootValue, keyRootValue);
    const isDiatonicRoot = MAJOR_SCALE_DEGREES.includes(degree);

    if (isDiatonicRoot) score += 2;
    if (degree === 0) score += 4;
    if (degree === 7) score += 2;
    if (degree === 5) score += 1;

    if (index === 0 && degree === 0) score += 4;
    if (index === chordSequence.length - 1 && degree === 0) score += 4;

    if (degree === 0 && !isMinorChord(chord)) score += 2;
  });

  return score;
}

function scoreMinorKey(chordSequence, keyRootValue) {
  let score = 0;

  chordSequence.forEach((chord, index) => {
    const root = getChordRoot(chord);
    const rootValue = getNoteValue(root);

    if (rootValue === undefined) return;

    const degree = getScaleDegree(rootValue, keyRootValue);
    const isNaturalMinorRoot = MINOR_SCALE_DEGREES.includes(degree);
    const isHarmonicMinorRoot = HARMONIC_MINOR_EXTRA_DEGREES.includes(degree);

    if (isNaturalMinorRoot) score += 2;
    if (isHarmonicMinorRoot) score += 1;

    if (degree === 0) score += 4;
    if (degree === 7) score += 2;
    if (degree === 8) score += 1;
    if (degree === 10) score += 1;

    if (index === 0 && degree === 0) score += 5;
    if (index === chordSequence.length - 1 && degree === 0) score += 5;

    if (degree === 0 && isMinorChord(chord)) score += 3;

    if (degree === 7 && isDominantChord(chord)) score += 5;
  });

  return score;
}

export function estimateSongKey(chordSequence) {
  if (!Array.isArray(chordSequence) || !chordSequence.length) return "";

  let best = {
    key: "",
    score: -Infinity,
  };

  for (let keyRootValue = 0; keyRootValue < 12; keyRootValue += 1) {
    const majorKey = getKeyName(keyRootValue, "major");
    const minorKey = getKeyName(keyRootValue, "minor");
    const majorScore = scoreMajorKey(chordSequence, keyRootValue);
    const minorScore = scoreMinorKey(chordSequence, keyRootValue);

    if (majorKey && majorScore > best.score) {
      best = {
        key: majorKey,
        score: majorScore,
      };
    }

    if (minorKey && minorScore > best.score) {
      best = {
        key: minorKey,
        score: minorScore,
      };
    }
  }

  return best.key;
}

export function analyzeSongText(text) {
  const rawChordSequence = extractChordsFromSongText(text);
  const chords = uniqueInOrder(rawChordSequence, 24);
  const transitions = createTransitionList(rawChordSequence);
  const sections = extractSectionsFromSongText(text);
  const difficulty = estimateDifficulty(chords);
  const key = estimateSongKey(rawChordSequence);

  return {
    chords,
    transitions,
    sections,
    difficulty,
    key,
    goal: createPracticeGoal({
      chords,
      transitions,
      sections,
    }),
  };
}
