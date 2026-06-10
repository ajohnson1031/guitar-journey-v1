import { parseReferenceMarkers } from "./referenceMarkerUtils";

function normalizeMarkerLabel(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normalizeMarkerSeconds(value) {
  const seconds = Number(value);

  return Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : null;
}

function getMarkerMatchKey(marker = {}) {
  const label = normalizeMarkerLabel(marker.label || marker.name || marker.sectionName);
  const seconds = normalizeMarkerSeconds(marker.seconds);

  if (!label || seconds === null) return "";

  return `${label}:${seconds}`;
}

function getCurrentMarkerMatchKeys(currentMarkerText = "") {
  return new Set(parseReferenceMarkers(currentMarkerText).map(getMarkerMatchKey).filter(Boolean));
}

function getDetectedMarkerReviewStats({ currentMarkerText = "", markers = [] } = {}) {
  const currentMarkerKeys = getCurrentMarkerMatchKeys(currentMarkerText);
  const detectedMarkerKeys = markers.map(getMarkerMatchKey).filter(Boolean);
  const appliedCount = detectedMarkerKeys.filter((key) => currentMarkerKeys.has(key)).length;
  const totalCount = detectedMarkerKeys.length;
  const unappliedCount = Math.max(0, totalCount - appliedCount);

  return {
    appliedCount,
    isFullyApplied: totalCount > 0 && unappliedCount === 0,
    totalCount,
    unappliedCount,
  };
}

function getDetectedMarkerPreviewText(markers = [], limit = 4) {
  return markers
    .slice(0, limit)
    .map((marker) => `${marker.label} ${marker.time || ""}`.trim())
    .join(" · ");
}

function getDetectedMarkerReviewSummary({ currentMarkerText = "", markers = [] } = {}) {
  const stats = getDetectedMarkerReviewStats({
    currentMarkerText,
    markers,
  });

  if (!stats.totalCount) return "No detected markers.";

  if (stats.isFullyApplied) {
    return `${stats.totalCount} detected marker${stats.totalCount === 1 ? "" : "s"} already applied.`;
  }

  if (stats.appliedCount) {
    return `${stats.unappliedCount} new marker${stats.unappliedCount === 1 ? "" : "s"} ready to apply · ${stats.appliedCount} already applied.`;
  }

  return `${stats.totalCount} detected marker${stats.totalCount === 1 ? "" : "s"} ready to review.`;
}

export {
  getCurrentMarkerMatchKeys,
  getDetectedMarkerPreviewText,
  getDetectedMarkerReviewStats,
  getDetectedMarkerReviewSummary,
  getMarkerMatchKey,
};
