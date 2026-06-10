const MAX_DEBUG_STRING_LENGTH = 1600;

function truncateDebugString(value, maxLength = MAX_DEBUG_STRING_LENGTH) {
  const text = String(value || "");

  if (text.length <= maxLength) return text;

  return `${text.slice(0, maxLength)}…`;
}

function sanitizeDebugValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeDebugValue);
  }

  if (value && typeof value === "object") {
    return Object.entries(value).reduce((nextValue, [key, entryValue]) => {
      if (typeof entryValue === "function" || typeof entryValue === "undefined") {
        return nextValue;
      }

      return {
        ...nextValue,
        [key]: sanitizeDebugValue(entryValue),
      };
    }, {});
  }

  if (typeof value === "string") {
    return truncateDebugString(value);
  }

  return value;
}

function getReferenceTrackDebugPayload(referenceTrack = {}) {
  if (!referenceTrack) return null;

  return sanitizeDebugValue({
    embedUrl: referenceTrack.embedUrl || "",
    error: referenceTrack.error || "",
    isEmpty: Boolean(referenceTrack.isEmpty),
    isValid: Boolean(referenceTrack.isValid),
    kind: referenceTrack.kind || "",
    mediaId: referenceTrack.mediaId || "",
    platform: referenceTrack.platform || "",
    platformLabel: referenceTrack.platformLabel || "",
    url: referenceTrack.url || referenceTrack.sourceUrl || "",
  });
}

function getMetadataDebugPayload(metadata = null) {
  if (!metadata) return null;

  return sanitizeDebugValue({
    authorName: metadata.authorName || "",
    chapterText: metadata.chapterText || "",
    descriptionText: metadata.descriptionText || "",
    durationSeconds: metadata.durationSeconds || null,
    extractedMarkers: Array.isArray(metadata.extractedMarkers)
      ? metadata.extractedMarkers.map((marker) => ({
          id: marker.id || "",
          label: marker.label || "",
          seconds: marker.seconds ?? null,
          time: marker.time || "",
        }))
      : [],
    metadataText: metadata.metadataText || "",
    providerName: metadata.providerName || "",
    source: metadata.source || "",
    sourceLabel: metadata.sourceLabel || "",
    sourceType: metadata.sourceType || "",
    thumbnailUrl: metadata.thumbnailUrl || "",
    title: metadata.title || "",
  });
}

function getMetadataStatusDebugPayload(metadataStatus = {}) {
  return sanitizeDebugValue({
    message: metadataStatus.message || "",
    sourceLabel: metadataStatus.sourceLabel || "",
    sourceType: metadataStatus.sourceType || "",
    tone: metadataStatus.tone || "",
  });
}

function getReferenceMetadataDebugPayload({ metadata = null, metadataStatus = {}, referenceTrack = {} } = {}) {
  return {
    metadata: getMetadataDebugPayload(metadata),
    referenceTrack: getReferenceTrackDebugPayload(referenceTrack),
    status: getMetadataStatusDebugPayload(metadataStatus),
  };
}

function stringifyReferenceMetadataDebugPayload(payload) {
  return JSON.stringify(sanitizeDebugValue(payload), null, 2);
}

export {
  getMetadataDebugPayload,
  getMetadataStatusDebugPayload,
  getReferenceMetadataDebugPayload,
  getReferenceTrackDebugPayload,
  sanitizeDebugValue,
  stringifyReferenceMetadataDebugPayload,
  truncateDebugString,
};
