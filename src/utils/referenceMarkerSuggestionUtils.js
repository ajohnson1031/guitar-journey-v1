import { formatReferenceMarkerTime, normalizeReferenceMarkers, parseReferenceMarkers, parseTimestampToSeconds } from "./referenceMarkerUtils";

const DEFAULT_BPM = 80;
const DEFAULT_BEATS_PER_CHORD = 4;

function normalizeSectionName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeSectionRole(value) {
  const normalized = normalizeSectionName(value).toLowerCase();

  if (/intro|opening|start/.test(normalized)) return "intro";
  if (/verse/.test(normalized)) return "verse";
  if (/pre[\s-]?chorus/.test(normalized)) return "pre-chorus";
  if (/chorus|hook|refrain/.test(normalized)) return "chorus";
  if (/bridge|middle/.test(normalized)) return "bridge";
  if (/solo|instrumental/.test(normalized)) return "solo";
  if (/interlude/.test(normalized)) return "interlude";
  if (/outro|ending|tag/.test(normalized)) return "outro";

  return "section";
}

function getSafeBpm(value) {
  const bpm = Number(value);

  if (!Number.isFinite(bpm)) return DEFAULT_BPM;

  return Math.min(220, Math.max(40, Math.round(bpm)));
}

function getProgressionText(section) {
  return String(section?.progression || section?.chords || "").trim();
}

function countProgressionChords(progression) {
  const text = String(progression || "").trim();

  if (!text) return 4;

  const separatorParts = text
    .split(/\s*(?:->|→|\||,|\/|[-–—])\s*/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (separatorParts.length > 1) return separatorParts.length;

  const whitespaceParts = text
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return Math.max(1, whitespaceParts.length || 4);
}

function getSectionRepeatMultiplier(sectionName) {
  const role = normalizeSectionRole(sectionName);

  if (role === "intro" || role === "outro") return 1;
  if (role === "interlude" || role === "pre-chorus" || role === "bridge" || role === "solo") return 1.25;
  if (role === "chorus" || role === "verse") return 2;

  return 1.5;
}

function roundToNearestSecond(value) {
  return Math.max(0, Math.round(Number(value) || 0));
}

function estimateSectionDurationSeconds(section, bpm = DEFAULT_BPM) {
  const safeBpm = getSafeBpm(bpm);
  const chordCount = countProgressionChords(getProgressionText(section));
  const repeatMultiplier = getSectionRepeatMultiplier(section?.name);
  const rawSeconds = ((chordCount * DEFAULT_BEATS_PER_CHORD * repeatMultiplier * 60) / safeBpm);

  return roundToNearestSecond(Math.min(72, Math.max(8, rawSeconds)));
}

function normalizeSectionList(sections = []) {
  if (!Array.isArray(sections)) return [];

  return sections
    .map((section, index) => ({
      id: `${normalizeSectionName(section?.name || `Section ${index + 1}`).toLowerCase().replace(/[^a-z0-9]+/g, "-") || "section"}-${index}`,
      index,
      name: normalizeSectionName(section?.name || `Section ${index + 1}`),
      progression: getProgressionText(section),
    }))
    .filter((section) => section.name);
}

function parseReferenceDurationInput(value) {
  const text = String(value || "").trim();

  if (!text) return null;

  const seconds = parseTimestampToSeconds(text);

  if (seconds === null) return null;

  return Math.max(1, seconds);
}

function getReferenceDurationSeconds(value) {
  if (Number.isFinite(Number(value)) && Number(value) > 0) {
    return Math.max(1, Math.round(Number(value)));
  }

  return parseReferenceDurationInput(value);
}

function getRawSectionDurations(sections, bpm) {
  return sections.map((section) => estimateSectionDurationSeconds(section, bpm));
}

function getScaledSectionDurations(sections, bpm, targetDurationSeconds) {
  const rawDurations = getRawSectionDurations(sections, bpm);
  const totalRawDuration = rawDurations.reduce((total, duration) => total + duration, 0);
  const safeTargetDuration = getReferenceDurationSeconds(targetDurationSeconds);

  if (!safeTargetDuration || !totalRawDuration) return rawDurations;

  return rawDurations.map((duration) => (duration / totalRawDuration) * safeTargetDuration);
}

function getSectionStartTimes(sections, bpm, targetDurationSeconds) {
  const durations = getScaledSectionDurations(sections, bpm, targetDurationSeconds);
  let runningSeconds = 0;

  return durations.map((duration) => {
    const startSeconds = roundToNearestSecond(runningSeconds);

    runningSeconds += duration;

    return startSeconds;
  });
}

function createSuggestedReferenceMarkers({ bpm = DEFAULT_BPM, existingMarkers = [], referenceDurationSeconds = null, sections = [] } = {}) {
  const normalizedSections = normalizeSectionList(sections);
  const normalizedExistingMarkers = normalizeReferenceMarkers(existingMarkers);

  if (!normalizedSections.length) return [];

  const sectionStartTimes = getSectionStartTimes(normalizedSections, bpm, referenceDurationSeconds);
  const markersByLabel = new Map(
    normalizedExistingMarkers.map((marker) => [
      normalizeSectionName(marker.label).toLowerCase(),
      marker,
    ]),
  );

  return normalizedSections.map((section, index) => {
    const existingMarker = markersByLabel.get(section.name.toLowerCase());

    if (existingMarker) return existingMarker;

    const seconds = sectionStartTimes[index] || 0;

    return {
      id: `${section.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "section"}-${seconds}`,
      isSuggested: true,
      label: section.name,
      seconds,
      time: formatReferenceMarkerTime(seconds),
    };
  });
}

function suggestedReferenceMarkersToText({ bpm = DEFAULT_BPM, existingMarkers = [], referenceDurationSeconds = null, sections = [] } = {}) {
  return createSuggestedReferenceMarkers({
    bpm,
    existingMarkers,
    referenceDurationSeconds,
    sections,
  })
    .map((marker) => `${marker.label}: ${formatReferenceMarkerTime(marker.seconds)}`)
    .join("\n");
}

function getSuggestedReferenceMarkerSummary({ bpm = DEFAULT_BPM, referenceDurationSeconds = null, sections = [] } = {}) {
  const normalizedSections = normalizeSectionList(sections);
  const safeReferenceDuration = getReferenceDurationSeconds(referenceDurationSeconds);

  if (!normalizedSections.length) {
    return "Add song sections before generating a marker draft.";
  }

  if (safeReferenceDuration) {
    return `Drafted ${normalizedSections.length} section markers across ${formatReferenceMarkerTime(safeReferenceDuration)}. Review the timestamps against the reference track before saving.`;
  }

  return `Drafted ${normalizedSections.length} section markers from song sections at ${getSafeBpm(bpm)} BPM. Add a reference duration for better full-song spacing.`;
}

function mergeReferenceMarkerDraft({ currentText = "", draftText = "" } = {}) {
  const currentMarkers = parseReferenceMarkers(currentText);
  const draftMarkers = parseReferenceMarkers(draftText);

  if (!currentMarkers.length) return draftText;

  const currentLabels = new Set(currentMarkers.map((marker) => normalizeSectionName(marker.label).toLowerCase()));
  const mergedMarkers = [
    ...currentMarkers,
    ...draftMarkers.filter((marker) => !currentLabels.has(normalizeSectionName(marker.label).toLowerCase())),
  ].sort((markerA, markerB) => markerA.seconds - markerB.seconds);

  return mergedMarkers.map((marker) => `${marker.label}: ${formatReferenceMarkerTime(marker.seconds)}`).join("\n");
}

export {
  createSuggestedReferenceMarkers,
  estimateSectionDurationSeconds,
  getReferenceDurationSeconds,
  getSectionStartTimes,
  getSuggestedReferenceMarkerSummary,
  parseReferenceDurationInput,
  suggestedReferenceMarkersToText,
  mergeReferenceMarkerDraft,
};
