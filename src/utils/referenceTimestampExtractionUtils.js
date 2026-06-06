import { formatReferenceMarkerTime, parseTimestampToSeconds } from "./referenceMarkerUtils";

const TIMESTAMP_TOKEN = "(?:(?:\\d{1,2}:)?\\d{1,2}:\\d{2})";
const LEADING_TIMESTAMP_PATTERN = new RegExp(`^\\s*(?:[-*•]\\s*)?(?:\\[|\\()?(${TIMESTAMP_TOKEN})(?:\\]|\\))?\\s*(?:[-–—:|]\\s*)?(.+?)\\s*$`);
const TRAILING_TIMESTAMP_PATTERN = new RegExp(`^\\s*(?:[-*•]\\s*)?(.+?)\\s*(?:[-–—:|]\\s*)(${TIMESTAMP_TOKEN})(?:\\s*)$`);

function normalizeTimestampLabel(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .replace(/^[\d.)\]-]+\s*/, "")
    .trim();
}

function getMarkerId(label, seconds) {
  return `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "marker"}-${seconds}`;
}

function createMarker(label, seconds) {
  const normalizedLabel = normalizeTimestampLabel(label);

  if (!normalizedLabel || seconds === null) return null;

  return {
    id: getMarkerId(normalizedLabel, seconds),
    isDetected: true,
    label: normalizedLabel,
    seconds,
    time: formatReferenceMarkerTime(seconds),
  };
}

function parseTimestampTextLine(line) {
  const text = String(line || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .trim();

  if (!text) return null;

  const leadingMatch = text.match(LEADING_TIMESTAMP_PATTERN);

  if (leadingMatch) {
    return createMarker(leadingMatch[2], parseTimestampToSeconds(leadingMatch[1]));
  }

  const trailingMatch = text.match(TRAILING_TIMESTAMP_PATTERN);

  if (trailingMatch) {
    return createMarker(trailingMatch[1], parseTimestampToSeconds(trailingMatch[2]));
  }

  return null;
}

function dedupeMarkers(markers = []) {
  const seen = new Set();

  return markers.filter((marker) => {
    const key = `${marker.label.toLowerCase()}-${marker.seconds}`;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function extractReferenceMarkersFromText(value) {
  const lines = String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return dedupeMarkers(lines.map(parseTimestampTextLine).filter(Boolean)).sort((markerA, markerB) => markerA.seconds - markerB.seconds);
}

function referenceTimestampMarkersToText(markers = []) {
  return markers
    .map((marker) => `${marker.label}: ${formatReferenceMarkerTime(marker.seconds)}`)
    .join("\n");
}

function getReferenceTimestampExtractionSummary(markers = []) {
  const count = markers.length;

  if (!count) return "No timestamp markers were detected.";

  return `Detected ${count} possible section marker${count === 1 ? "" : "s"}. Review before applying.`;
}

export {
  extractReferenceMarkersFromText,
  getReferenceTimestampExtractionSummary,
  parseTimestampTextLine,
  referenceTimestampMarkersToText,
};
