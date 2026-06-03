import { KEY_OPTIONS } from "../constants";

const SECTION_LABELS = ["intro", "verse", "pre-chorus", "pre chorus", "chorus", "refrain", "bridge", "interlude", "solo", "guitar solo", "outro", "tag"];
const METADATA_LABELS = ["Title", "Artist", "Instrument / Type", "Instrument", "Type", "Genre", "Difficulty", "Key", "Tuning", "Capo", "BPM", "Tempo"];

const CHORD_PATTERN =
  /(^|[\s|()[\]{}:])([A-G](?:#|b)?)(maj7|maj9|maj|min7|min9|min|m7b5|m7|m9|m6|m|dim7|dim|sus2|sus4|sus|add9|7sus4|7sus|13|11|9|7|6|5)?(?:\/([A-G](?:#|b)?))?(?=$|[\s|()[\]{}:.,;!?])/g;

const BRACKETED_CHORD_PATTERN = /\[([A-G](?:#|b)?(?:maj7|maj9|maj|min7|min9|min|m7b5|m7|m9|m6|m|dim7|dim|sus2|sus4|sus|add9|7sus4|7sus|13|11|9|7|6|5)?(?:\/[A-G](?:#|b)?)?)\]/;

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

function normalizeMetadataLabel(label) {
  return String(label || "")
    .trim()
    .replace(/\s*\/\s*/g, " / ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function escapeMetadataLabel(label) {
  return String(label || "")
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\ \/\\ /g, "\\s*\\/\\s*");
}

function getMetadataLabelPattern() {
  return METADATA_LABELS.slice()
    .sort((leftLabel, rightLabel) => rightLabel.length - leftLabel.length)
    .map(escapeMetadataLabel)
    .join("|");
}

function normalizeMetadataText(text) {
  const labelPattern = getMetadataLabelPattern();

  return String(text || "")
    .replace(/\r\n?/g, "\n")
    .replace(new RegExp(`(${labelPattern})\\s*:`, "gi"), "\n$1:")
    .trim();
}

function getMetadataValue(text, labels) {
  const labelList = Array.isArray(labels) ? labels : [labels];
  const normalizedText = normalizeMetadataText(text);
  const labelPattern = getMetadataLabelPattern();

  for (const label of labelList) {
    const escapedLabel = escapeMetadataLabel(label);
    const pattern = new RegExp(`^\\s*${escapedLabel}\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*(?:${labelPattern})\\s*:|$)`, "im");
    const match = normalizedText.match(pattern);

    if (match) {
      return String(match[1] || "")
        .replace(/\s+/g, " ")
        .trim();
    }
  }

  return "";
}

function isMetadataLine(line) {
  const normalized = normalizeMetadataLabel(String(line || "").split(":")[0]);

  return METADATA_LABELS.some((label) => normalizeMetadataLabel(label) === normalized);
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

function removeSectionLabelFromLine(line, sectionLabel) {
  if (!sectionLabel) return line;

  const escapedLabel = sectionLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const bracketedPattern = new RegExp(`\\[\\s*${escapedLabel}\\s*\\d*\\s*\\]`, "i");
  const plainPattern = new RegExp(`^\\s*${escapedLabel}\\s*\\d*\\s*:?\\s*`, "i");

  return String(line || "")
    .replace(bracketedPattern, " ")
    .replace(plainPattern, " ");
}

function hasBracketedChord(line) {
  return BRACKETED_CHORD_PATTERN.test(String(line || ""));
}

function getLineWords(line) {
  return String(line || "")
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/^[^A-Za-z#b/]+|[^A-Za-z#b/]+$/g, ""))
    .filter(Boolean);
}

function startsWithChordAndSpacing(line, chord) {
  const escapedChord = chord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^\\s*${escapedChord}\\s{2,}`, "i");

  return pattern.test(line);
}

function shouldAcceptChordCandidates(line, chordCandidates) {
  if (!chordCandidates.length) return false;

  if (hasBracketedChord(line)) return true;
  if (chordCandidates.length >= 2) return true;

  const normalizedLine = normalizeBracketedText(line).trim();
  const onlyChord = chordCandidates[0];

  if (normalizedLine === onlyChord) return true;
  if (startsWithChordAndSpacing(normalizedLine, onlyChord)) return true;

  const words = getLineWords(normalizedLine);
  const chordWordCount = words.filter((word) => isLikelyChord(normalizeChord(word))).length;
  const nonChordWordCount = words.length - chordWordCount;

  return chordWordCount > 0 && nonChordWordCount === 0;
}

function extractChordsFromLine(line) {
  if (isMetadataLine(line)) return [];

  const chordCandidates = [];
  const normalizedLine = normalizeBracketedText(line).replace(/[|()]/g, " ");

  for (const match of normalizedLine.matchAll(CHORD_PATTERN)) {
    const root = match[2] || "";
    const quality = match[3] || "";
    const slashRoot = match[4] ? `/${match[4]}` : "";
    const chord = normalizeChord(`${root}${quality}${slashRoot}`);

    if (isLikelyChord(chord)) {
      chordCandidates.push(chord);
    }
  }

  if (!shouldAcceptChordCandidates(line, chordCandidates)) {
    return [];
  }

  return chordCandidates;
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

      const sameLineChords = extractChordsFromLine(removeSectionLabelFromLine(line, sectionLabel));

      if (sameLineChords.length) {
        currentSection.chords.push(...sameLineChords);
      }

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
  const advancedChordCount = uniqueChords.filter((chord) => /(maj7|maj9|m7b5|dim|dim7|sus2|sus4|add9|13|11|9|7|6|#|b|\/)/.test(chord)).length;

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

function estimateDifficultyConfidence(chords) {
  const uniqueChords = uniqueInOrder(chords, 48);

  if (uniqueChords.length >= 6) return "high";
  if (uniqueChords.length >= 3) return "medium";

  return "low";
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

  return matchingOption || "";
}

function getScaleDegree(rootValue, keyRootValue) {
  return (rootValue - keyRootValue + 12) % 12;
}

function scoreMajorKey(chordSequence, keyRootValue) {
  let score = 0;

  chordSequence.forEach((chord, index) => {
    const root = getChordRoot(chord);
    const rootValue = NOTE_VALUES[root];

    if (rootValue === undefined) return;

    const degree = getScaleDegree(rootValue, keyRootValue);
    const isDiatonicRoot = MAJOR_SCALE_DEGREES.includes(degree);

    if (isDiatonicRoot) score += 2;
    if (degree === 0) score += 4;
    if (degree === 7) score += 2;
    if (index === 0 && degree === 0) score += 3;
    if (index === chordSequence.length - 1 && degree === 0) score += 3;
    if (degree === 0 && !isMinorChord(chord)) score += 2;
  });

  return score;
}

function scoreMinorKey(chordSequence, keyRootValue) {
  let score = 0;

  chordSequence.forEach((chord, index) => {
    const root = getChordRoot(chord);
    const rootValue = NOTE_VALUES[root];

    if (rootValue === undefined) return;

    const degree = getScaleDegree(rootValue, keyRootValue);
    const isNaturalMinorRoot = MINOR_SCALE_DEGREES.includes(degree);

    if (isNaturalMinorRoot) score += 2;
    if (degree === 0) score += 4;
    if (degree === 7) score += 2;
    if (index === 0 && degree === 0) score += 4;
    if (index === chordSequence.length - 1 && degree === 0) score += 4;
    if (degree === 0 && isMinorChord(chord)) score += 3;
  });

  return score;
}

function getConfidenceFromScoreGap(bestScore, secondBestScore) {
  if (!Number.isFinite(bestScore) || bestScore <= 0) return "low";

  const gap = bestScore - secondBestScore;

  if (gap >= 16) return "high";
  if (gap >= 7) return "medium";

  return "low";
}

export function estimateSongKeyDetails(chordSequence) {
  if (!Array.isArray(chordSequence) || !chordSequence.length) {
    return {
      key: "",
      confidence: "low",
      score: 0,
    };
  }

  let best = {
    key: "",
    score: -Infinity,
  };

  let secondBest = {
    key: "",
    score: -Infinity,
  };

  function considerCandidate(candidate) {
    if (!candidate.key) return;

    if (candidate.score > best.score) {
      secondBest = best;
      best = candidate;
      return;
    }

    if (candidate.score > secondBest.score) {
      secondBest = candidate;
    }
  }

  for (let keyRootValue = 0; keyRootValue < 12; keyRootValue += 1) {
    considerCandidate({
      key: getKeyName(keyRootValue, "major"),
      score: scoreMajorKey(chordSequence, keyRootValue),
    });

    considerCandidate({
      key: getKeyName(keyRootValue, "minor"),
      score: scoreMinorKey(chordSequence, keyRootValue),
    });
  }

  return {
    key: best.key,
    confidence: getConfidenceFromScoreGap(best.score, secondBest.score),
    score: best.score,
  };
}

export function estimateSongKey(chordSequence) {
  return estimateSongKeyDetails(chordSequence).key;
}

function normalizeTuningValue(value) {
  const cleaned = String(value || "")
    .trim()
    .replace(/\s+/g, " ");

  const compact = cleaned.replace(/\s+/g, "").toUpperCase();
  const lower = cleaned.toLowerCase();

  if (!cleaned) return "";

  if (lower.includes("standard") && !lower.includes("half") && !lower.includes("eb")) {
    return "Standard";
  }

  if (compact === "EADGBE") {
    return "Standard";
  }

  if (compact === "DADGBE" || lower.includes("drop d")) {
    return "Drop D";
  }

  if (compact === "DGCFAD" || lower.includes("d standard")) {
    return "D Standard";
  }

  if (lower.includes("drop c")) {
    return "Drop C";
  }

  if (lower.includes("half-step") || lower.includes("half step") || lower.includes("eb standard")) {
    return "Eb Standard";
  }

  return cleaned;
}

function getOrdinalSuffix(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return "";

  const mod100 = number % 100;

  if (mod100 >= 11 && mod100 <= 13) return "th";

  switch (number % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function normalizeCapoValue(value) {
  const cleaned = String(value || "")
    .trim()
    .replace(/\s+/g, " ");

  const lower = cleaned.toLowerCase();

  if (!cleaned) return "";

  if (lower.includes("no capo") || lower === "none" || lower === "no") {
    return "No capo";
  }

  const fretMatch = cleaned.match(/(\d+)/);

  if (fretMatch) {
    const fret = fretMatch[1];

    return `${fret}${getOrdinalSuffix(fret)} fret`;
  }

  return cleaned;
}

function normalizeKeyMetadataValue(value) {
  const cleaned = String(value || "")
    .trim()
    .replace(/\s+/g, " ");

  if (!cleaned) return "";

  const exactMatch = KEY_OPTIONS.find((keyOption) => keyOption.toLowerCase() === cleaned.toLowerCase());

  if (exactMatch) return exactMatch;

  const match = cleaned.match(/^([A-G](?:#|b)?)(?:\s*(m|min|minor|maj|major))?/i);

  if (!match) return "";

  const root = `${match[1][0].toUpperCase()}${match[1].slice(1)}`;
  const quality = String(match[2] || "").toLowerCase();
  const mode = quality === "m" || quality === "min" || quality === "minor" ? "minor" : "major";
  const rootValue = NOTE_VALUES[root];

  if (rootValue === undefined) return "";

  return getKeyName(rootValue, mode);
}

function normalizeDifficultyValue(value) {
  const cleaned = String(value || "")
    .trim()
    .replace(/\s+/g, " ");

  if (!cleaned) return "";

  const exactOptions = ["Beginner", "Intermediate", "Advanced", "Expert"];
  const exactMatch = exactOptions.find((option) => option.toLowerCase() === cleaned.toLowerCase());

  if (exactMatch) return exactMatch;

  const lower = cleaned.toLowerCase();

  if (lower.includes("beginner")) return "Beginner";
  if (lower.includes("intermediate")) return "Intermediate";
  if (lower.includes("advanced")) return "Advanced";
  if (lower.includes("expert")) return "Expert";

  return "";
}

function normalizeBpmValue(value) {
  const match = String(value || "").match(/\d+/);
  const bpm = match ? Number(match[0]) : NaN;

  if (!Number.isFinite(bpm)) return "";

  return Math.min(220, Math.max(40, Math.round(bpm)));
}

function extractSongMetadata(text) {
  const title = getMetadataValue(text, "Title");
  const artist = getMetadataValue(text, "Artist");
  const instrument = getMetadataValue(text, ["Instrument / Type", "Instrument", "Type"]);
  const genre = getMetadataValue(text, "Genre");
  const difficulty = normalizeDifficultyValue(getMetadataValue(text, "Difficulty"));
  const key = normalizeKeyMetadataValue(getMetadataValue(text, "Key"));
  const tuning = normalizeTuningValue(getMetadataValue(text, "Tuning"));
  const capo = normalizeCapoValue(getMetadataValue(text, "Capo"));
  const bpm = normalizeBpmValue(getMetadataValue(text, ["BPM", "Tempo"]));

  return {
    title,
    artist,
    instrument,
    genre,
    difficulty,
    key,
    tuning,
    capo,
    bpm,
  };
}

function getMainSection(sections) {
  if (!Array.isArray(sections) || !sections.length) return null;

  return sections.find((section) => /verse|chorus|refrain/i.test(section.name)) || sections.find((section) => !/intro|outro/i.test(section.name)) || sections[0];
}

function createPracticeGoal({ chords, key, sections, title, transitions }) {
  const mainSection = getMainSection(sections);
  const firstTransition = transitions[0];

  const parts = [];

  if (title) {
    parts.push(`Learn ${title}`);
  } else if (key) {
    parts.push(`Learn the song in ${key}`);
  } else {
    parts.push("Learn the song");
  }

  if (mainSection) {
    parts.push(`focus on the ${mainSection.name.toLowerCase()} progression`);
  }

  if (firstTransition) {
    parts.push(`tighten the ${firstTransition} transition`);
  }

  if (!mainSection && !firstTransition && chords.length) {
    parts.push(`build clean changes across ${chords.slice(0, 4).join(", ")}`);
  }

  return `${parts.join(", ")}, and build a confident full-song playthrough.`;
}

export function analyzeSongText(text) {
  const metadata = extractSongMetadata(text);
  const rawChordSequence = extractChordsFromSongText(text);
  const chords = uniqueInOrder(rawChordSequence, 24);
  const transitions = createTransitionList(rawChordSequence);
  const sections = extractSectionsFromSongText(text);
  const estimatedDifficulty = estimateDifficulty(chords);
  const difficulty = metadata.difficulty || estimatedDifficulty;
  const difficultyConfidence = metadata.difficulty ? "high" : estimateDifficultyConfidence(chords);
  const keyDetails = estimateSongKeyDetails(rawChordSequence);
  const key = metadata.key || keyDetails.key;

  return {
    title: metadata.title,
    artist: metadata.artist,
    instrument: metadata.instrument,
    genre: metadata.genre,
    bpm: metadata.bpm,
    chords,
    transitions,
    sections,
    difficulty,
    difficultyConfidence,
    key,
    keyConfidence: metadata.key ? "high" : keyDetails.confidence,
    keySource: metadata.key ? "metadata" : "estimated",
    tuning: metadata.tuning,
    capo: metadata.capo,
    goal: createPracticeGoal({
      chords,
      key,
      sections,
      title: metadata.title,
      transitions,
    }),
  };
}
