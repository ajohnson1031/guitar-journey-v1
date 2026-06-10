import { extractReferenceMarkersFromText } from "./referenceTimestampExtractionUtils";

const OEMBED_ENDPOINTS = {
  soundcloud: "https://soundcloud.com/oembed",
  spotify: "https://open.spotify.com/oembed",
  vimeo: "https://vimeo.com/api/oembed.json",
  youtube: "https://www.youtube.com/oembed",
};

function normalizeReferenceMetadata(metadata = {}) {
  const title = String(metadata.title || metadata.name || "").trim();
  const authorName = String(metadata.authorName || metadata.author_name || metadata.author || "").trim();
  const providerName = String(metadata.providerName || metadata.provider_name || metadata.provider || "").trim();
  const thumbnailUrl = String(metadata.thumbnailUrl || metadata.thumbnail_url || metadata.thumbnail || "").trim();
  const descriptionText = String(metadata.descriptionText || metadata.description || metadata.summary || "").trim();
  const chapterText = String(metadata.chapterText || metadata.chapters || "").trim();
  const html = String(metadata.html || "").trim();
  const metadataText = [title, authorName, providerName, descriptionText, chapterText, html, metadata.metadataText]
    .filter(Boolean)
    .join("\n");
  const extractedMarkers = Array.isArray(metadata.extractedMarkers)
    ? metadata.extractedMarkers
    : extractReferenceMarkersFromText(metadataText);
  const duration = Number(metadata.durationSeconds ?? metadata.duration ?? metadata.duration_ms / 1000);
  const durationSeconds = Number.isFinite(duration) && duration > 0 ? Math.round(duration) : null;

  return {
    authorName,
    chapterText,
    descriptionText,
    durationSeconds,
    extractedMarkers,
    metadataText,
    providerName,
    source: metadata.source || "",
    sourceLabel: metadata.sourceLabel || metadata.source_label || "",
    sourceType: metadata.sourceType || metadata.source_type || metadata.metadataSource || "",
    thumbnailUrl,
    title,
  };
}

function hasReferenceMetadata(metadata) {
  if (!metadata) return false;

  return Boolean(metadata.title || metadata.authorName || metadata.thumbnailUrl || metadata.durationSeconds || metadata.extractedMarkers?.length);
}

function getStoredReferenceMetadata(referenceTrack = {}) {
  const metadata = normalizeReferenceMetadata(referenceTrack);

  return hasReferenceMetadata(metadata) ? metadata : null;
}

function getMetadataSourceLabel(referenceTrack) {
  if (referenceTrack?.platformLabel) return referenceTrack.platformLabel;

  if (referenceTrack?.platform === "youtube") return "YouTube";
  if (referenceTrack?.platform === "vimeo") return "Vimeo";
  if (referenceTrack?.platform === "spotify") return "Spotify";
  if (referenceTrack?.platform === "soundcloud") return "SoundCloud";

  return "reference";
}

function getReferenceMetadataSupport(referenceTrack) {
  if (!referenceTrack?.isValid && !referenceTrack?.url) return "unsupported";

  if (referenceTrack.platform && OEMBED_ENDPOINTS[referenceTrack.platform]) {
    return referenceTrack.platform;
  }

  return "unsupported";
}

function buildOEmbedUrl(referenceTrack) {
  const endpoint = OEMBED_ENDPOINTS[referenceTrack?.platform];

  if (!endpoint || !referenceTrack?.url) return "";

  const url = new URL(endpoint);

  url.searchParams.set("url", referenceTrack.url);
  url.searchParams.set("format", "json");

  return url.href;
}

function normalizeOEmbedMetadata(data = {}, referenceTrack = {}) {
  const normalized = normalizeReferenceMetadata(data);

  return {
    ...normalized,
    providerName: normalized.providerName || getMetadataSourceLabel(referenceTrack),
    source: referenceTrack.platform || "generic",
    sourceLabel: getMetadataSourceLabel(referenceTrack),
    sourceType: "oembed",
  };
}

async function resolveReferenceMetadata(referenceTrack) {
  const support = getReferenceMetadataSupport(referenceTrack);

  if (support === "unsupported" || typeof globalThis.fetch !== "function") {
    return null;
  }

  const response = await globalThis.fetch(buildOEmbedUrl(referenceTrack));

  if (!response.ok) return null;

  const data = await response.json();

  if (import.meta.env.DEV) {
    console.group("[Reference Metadata] Raw oEmbed response");
    console.log("referenceTrack:", referenceTrack);
    console.log("raw data:", data);
    console.groupEnd();
  }

  const metadata = normalizeOEmbedMetadata(data, referenceTrack);

  if (import.meta.env.DEV) {
    console.group("[Reference Metadata] Normalized metadata");
    console.log(metadata);
    console.groupEnd();
  }

  return hasReferenceMetadata(metadata) ? metadata : null;
}

export {
  buildOEmbedUrl,
  getMetadataSourceLabel,
  getReferenceMetadataSupport,
  getStoredReferenceMetadata,
  hasReferenceMetadata,
  normalizeOEmbedMetadata,
  normalizeReferenceMetadata,
  resolveReferenceMetadata,
};
