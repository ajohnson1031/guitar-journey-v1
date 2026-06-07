import { getReferenceMetadataFromBackend } from "./referenceMetadataBackendContractUtils";
import {
  getMetadataSourceLabel,
  getReferenceMetadataSupport,
  hasReferenceMetadata,
  normalizeReferenceMetadata,
  resolveReferenceMetadata as resolveOEmbedReferenceMetadata,
} from "./referenceMetadataUtils";
import { extractReferenceMarkersFromText } from "./referenceTimestampExtractionUtils";

const MOCK_REFERENCE_METADATA_BY_KEY = {
  "guitar-journey-demo": {
    authorName: "Guitar Journey Demo",
    chapterText: `0:00 Intro
0:14 Verse
0:48 Chorus
1:24 Verse 2
2:00 Chorus
2:38 Bridge
3:12 Final Chorus
4:02 Outro`,
    descriptionText: "Development-only mock metadata for testing timestamp extraction.",
    durationSeconds: 274,
    providerName: "YouTube",
    thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    title: "Demo Practice Reference",
  },
};

function isDevRuntime() {
  return Boolean(import.meta.env?.DEV);
}

function getReferenceLookupKey(referenceTrack = {}) {
  return referenceTrack.mediaId || referenceTrack.url || "";
}

function hasMockMetadataFlag(referenceTrack = {}) {
  if (!referenceTrack?.url) return false;

  try {
    const url = new URL(referenceTrack.url);

    return url.searchParams.get("gjMockChapters") === "1" || url.searchParams.get("mockChapters") === "1";
  } catch {
    return false;
  }
}

function getMockReferenceMetadataSeed(referenceTrack = {}, { forceMock = false } = {}) {
  if (forceMock || hasMockMetadataFlag(referenceTrack)) {
    return MOCK_REFERENCE_METADATA_BY_KEY["guitar-journey-demo"];
  }

  const lookupKey = getReferenceLookupKey(referenceTrack);

  return MOCK_REFERENCE_METADATA_BY_KEY[lookupKey] || null;
}

function normalizeProviderMetadata(metadata = {}, referenceTrack = {}, sourceType = "provider") {
  const normalized = normalizeReferenceMetadata(metadata);
  const extractedMarkers = normalized.extractedMarkers?.length
    ? normalized.extractedMarkers
    : extractReferenceMarkersFromText([normalized.chapterText, normalized.descriptionText, normalized.metadataText].filter(Boolean).join("\n"));

  return {
    ...normalized,
    extractedMarkers,
    providerName: normalized.providerName || getMetadataSourceLabel(referenceTrack),
    source: referenceTrack.platform || "generic",
    sourceLabel: getMetadataSourceLabel(referenceTrack),
    sourceType,
  };
}

function resolveMockReferenceMetadata(referenceTrack = {}, options = {}) {
  const mockMetadata = getMockReferenceMetadataSeed(referenceTrack, options);

  if (!mockMetadata) return null;

  const metadata = normalizeProviderMetadata(mockMetadata, referenceTrack, "mock");

  return hasReferenceMetadata(metadata) ? metadata : null;
}

function shouldUseMockProviderMetadata(referenceTrack = {}, { forceMock = false } = {}) {
  return Boolean(forceMock || (isDevRuntime() && getMockReferenceMetadataSeed(referenceTrack)));
}

function getReferenceMetadataProviderSupport(referenceTrack = {}) {
  if (shouldUseMockProviderMetadata(referenceTrack)) return "mock";

  return getReferenceMetadataSupport(referenceTrack);
}

function getProviderMetadataSourceLabel(referenceTrack = {}) {
  const support = getReferenceMetadataProviderSupport(referenceTrack);

  if (support === "mock") return `${getMetadataSourceLabel(referenceTrack)} mock`;

  return getMetadataSourceLabel(referenceTrack);
}

async function resolveReferenceMetadataFromProvider(referenceTrack = {}, options = {}) {
  if (shouldUseMockProviderMetadata(referenceTrack, options)) {
    return resolveMockReferenceMetadata(referenceTrack, options);
  }

  const backendMetadata = await getReferenceMetadataFromBackend(referenceTrack, options);

  if (backendMetadata) {
    return backendMetadata;
  }

  const oEmbedMetadata = await resolveOEmbedReferenceMetadata(referenceTrack);

  return oEmbedMetadata ? normalizeProviderMetadata(oEmbedMetadata, referenceTrack, "oembed") : null;
}

export {
  getProviderMetadataSourceLabel,
  getReferenceMetadataProviderSupport,
  normalizeProviderMetadata,
  resolveMockReferenceMetadata,
  resolveReferenceMetadataFromProvider,
  shouldUseMockProviderMetadata,
};
