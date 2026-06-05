const TIMESTAMP_PATTERN = /^(?:(\d+)\s*:)?(\d{1,2})\s*:\s*(\d{2})$|^(\d+(?:\.\d+)?)$/;
const MARKER_LINE_PATTERN = /^(.*?)\s*(?::|[-–—])\s*((?:(?:\d+:)?\d{1,2}:\d{2})|\d+(?:\.\d+)?)$/;

function normalizeReferenceMarkerName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeMarkerLookupValue(value) {
  return normalizeReferenceMarkerName(value).toLowerCase();
}

function parseTimestampToSeconds(value) {
  const text = String(value || "").trim();

  if (!text) return null;

  const match = text.match(TIMESTAMP_PATTERN);

  if (!match) return null;

  if (match[4]) {
    const directSeconds = Number(match[4]);

    return Number.isFinite(directSeconds) ? Math.max(0, Math.round(directSeconds)) : null;
  }

  const hoursOrMinutes = match[1] ? Number(match[1]) : 0;
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);

  if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || seconds > 59) return null;

  if (match[1]) {
    return Math.max(0, hoursOrMinutes * 3600 + minutes * 60 + seconds);
  }

  return Math.max(0, minutes * 60 + seconds);
}

function formatReferenceMarkerTime(seconds) {
  const safeSeconds = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainderSeconds = safeSeconds % 60;

  if (hours) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainderSeconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainderSeconds).padStart(2, "0")}`;
}

function parseReferenceMarkerLine(line) {
  const text = String(line || "").trim();

  if (!text) return null;

  const match = text.match(MARKER_LINE_PATTERN);

  if (!match) return null;

  const name = normalizeReferenceMarkerName(match[1]);
  const seconds = parseTimestampToSeconds(match[2]);

  if (!name || seconds === null) return null;

  return {
    id: `${normalizeMarkerLookupValue(name).replace(/[^a-z0-9]+/g, "-")}-${seconds}`,
    label: name,
    seconds,
    time: formatReferenceMarkerTime(seconds),
  };
}

function normalizeReferenceMarkers(markers = []) {
  if (typeof markers === "string") {
    return parseReferenceMarkers(markers);
  }

  if (!Array.isArray(markers)) return [];

  return markers
    .map((marker) => {
      const label = normalizeReferenceMarkerName(marker?.label || marker?.name || marker?.sectionName);
      const seconds = Number.isFinite(Number(marker?.seconds)) ? Math.max(0, Math.round(Number(marker.seconds))) : parseTimestampToSeconds(marker?.time);

      if (!label || seconds === null) return null;

      return {
        id: marker.id || `${normalizeMarkerLookupValue(label).replace(/[^a-z0-9]+/g, "-")}-${seconds}`,
        label,
        seconds,
        time: formatReferenceMarkerTime(seconds),
      };
    })
    .filter(Boolean)
    .sort((markerA, markerB) => markerA.seconds - markerB.seconds);
}

function parseReferenceMarkers(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map(parseReferenceMarkerLine)
    .filter(Boolean)
    .sort((markerA, markerB) => markerA.seconds - markerB.seconds);
}

function referenceMarkersToText(markers = []) {
  return normalizeReferenceMarkers(markers)
    .map((marker) => `${marker.label}: ${formatReferenceMarkerTime(marker.seconds)}`)
    .join("\n");
}

function getReferenceMarkerForSection(markers = [], sectionName) {
  const normalizedSectionName = normalizeMarkerLookupValue(sectionName);

  if (!normalizedSectionName) return null;

  return normalizeReferenceMarkers(markers).find((marker) => normalizeMarkerLookupValue(marker.label) === normalizedSectionName) || null;
}

function formatYouTubeTimestamp(seconds) {
  return `${Math.max(0, Math.round(Number(seconds) || 0))}s`;
}

function formatVimeoTimestamp(seconds) {
  const safeSeconds = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainderSeconds = safeSeconds % 60;
  const parts = [];

  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  parts.push(`${remainderSeconds}s`);

  return parts.join("");
}

function buildReferenceTimestampUrl(referenceTrack, seconds = 0) {
  const sourceUrl = referenceTrack?.url || referenceTrack?.sourceUrl || "";

  if (!sourceUrl) return "";

  try {
    const url = new URL(sourceUrl);
    const platform = referenceTrack?.platform || "generic";
    const safeSeconds = Math.max(0, Math.round(Number(seconds) || 0));

    if (platform === "youtube") {
      url.searchParams.set("t", formatYouTubeTimestamp(safeSeconds));
      return url.href;
    }

    if (platform === "vimeo") {
      url.hash = `t=${formatVimeoTimestamp(safeSeconds)}`;
      return url.href;
    }

    if (platform === "generic") {
      url.hash = `t=${safeSeconds}`;
      return url.href;
    }

    return url.href;
  } catch {
    return sourceUrl;
  }
}

export {
  buildReferenceTimestampUrl,
  formatReferenceMarkerTime,
  getReferenceMarkerForSection,
  normalizeReferenceMarkers,
  parseReferenceMarkers,
  parseTimestampToSeconds,
  referenceMarkersToText,
};
