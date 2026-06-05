import { buildReferenceTimestampUrl, formatReferenceMarkerTime, getReferenceMarkerForSection, normalizeReferenceMarkers } from "./referenceMarkerUtils";

function normalizeArrangementSectionName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function getReferenceTrackForSong(song) {
  if (song?.referenceTrack?.url) return song.referenceTrack;

  if (song?.sourceUrl) {
    return {
      platform: "generic",
      platformLabel: "Reference",
      url: song.sourceUrl,
    };
  }

  return null;
}

function getSectionProgression(section) {
  return section?.progression || section?.chords || "";
}

function getNextMarker(markers, seconds) {
  return markers.find((marker) => marker.seconds > seconds) || null;
}

function createTimedPracticeArrangement(song) {
  const sections = Array.isArray(song?.sections) ? song.sections : [];
  const markers = normalizeReferenceMarkers(song?.referenceMarkers);
  const referenceTrack = getReferenceTrackForSong(song);
  const usedMarkerIds = new Set();

  const timedSections = sections.map((section, index) => {
    const marker = getReferenceMarkerForSection(markers, section.name);
    const nextMarker = marker ? getNextMarker(markers, marker.seconds) : null;
    const durationSeconds = marker && nextMarker ? Math.max(0, nextMarker.seconds - marker.seconds) : null;
    const referenceUrl = marker && referenceTrack ? buildReferenceTimestampUrl(referenceTrack, marker.seconds) : "";

    if (marker?.id) {
      usedMarkerIds.add(marker.id);
    }

    return {
      durationSeconds,
      durationText: durationSeconds === null ? "" : formatReferenceMarkerTime(durationSeconds),
      id: `${normalizeArrangementSectionName(section.name).replace(/[^a-z0-9]+/g, "-") || "section"}-${index}`,
      index,
      isTimed: Boolean(marker),
      marker,
      name: section.name || `Section ${index + 1}`,
      nextMarker,
      progression: getSectionProgression(section),
      referenceUrl,
      startSeconds: marker?.seconds ?? null,
      startTime: marker ? formatReferenceMarkerTime(marker.seconds) : "",
    };
  });

  const unassignedMarkers = markers.filter((marker) => !usedMarkerIds.has(marker.id));
  const timedSectionsCount = timedSections.filter((section) => section.isTimed).length;

  return {
    hasMarkers: markers.length > 0,
    hasReference: Boolean(referenceTrack?.url),
    markers,
    missingSectionsCount: Math.max(0, timedSections.length - timedSectionsCount),
    referenceTrack,
    sections: timedSections,
    timedSectionsCount,
    totalSections: timedSections.length,
    unassignedMarkers,
  };
}

function getArrangementCompletionLabel(arrangement) {
  if (!arrangement?.totalSections) return "No sections";

  return `${arrangement.timedSectionsCount}/${arrangement.totalSections} timed`;
}

export { createTimedPracticeArrangement, getArrangementCompletionLabel };
