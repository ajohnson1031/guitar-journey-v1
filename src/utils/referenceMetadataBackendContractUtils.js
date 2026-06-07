import { normalizeProviderMetadata } from "./referenceMetadataProviderAdapterUtils";

const DEFAULT_REFERENCE_METADATA_ENDPOINT = "/api/reference-metadata";

function getReferenceMetadataEndpoint() {
  return import.meta.env?.VITE_REFERENCE_METADATA_ENDPOINT || DEFAULT_REFERENCE_METADATA_ENDPOINT;
}

function buildReferenceMetadataRequest(referenceTrack = {}) {
  return {
    embedUrl: referenceTrack.embedUrl || "",
    kind: referenceTrack.kind || "",
    mediaId: referenceTrack.mediaId || "",
    platform: referenceTrack.platform || "generic",
    platformLabel: referenceTrack.platformLabel || "",
    sourceUrl: referenceTrack.url || referenceTrack.sourceUrl || "",
  };
}

function validateReferenceMetadataRequest(request = {}) {
  if (!request.sourceUrl) {
    return {
      isValid: false,
      error: "Reference metadata request requires a sourceUrl.",
    };
  }

  return {
    isValid: true,
    error: "",
  };
}

function buildReferenceMetadataUrl(referenceTrack = {}, endpoint = getReferenceMetadataEndpoint()) {
  const request = buildReferenceMetadataRequest(referenceTrack);
  const validation = validateReferenceMetadataRequest(request);

  if (!validation.isValid) return "";

  const url = new URL(endpoint, globalThis.location?.origin || "http://localhost");

  url.searchParams.set("url", request.sourceUrl);
  url.searchParams.set("platform", request.platform);

  if (request.mediaId) url.searchParams.set("mediaId", request.mediaId);
  if (request.kind) url.searchParams.set("kind", request.kind);

  if (endpoint.startsWith("http")) return url.href;

  return `${url.pathname}${url.search}`;
}

function isReferenceMetadataResponse(value) {
  return Boolean(value && typeof value === "object");
}

function unwrapReferenceMetadataResponse(response = {}) {
  if (!isReferenceMetadataResponse(response)) return null;

  if (response.metadata && typeof response.metadata === "object") {
    return response.metadata;
  }

  if (response.data && typeof response.data === "object") {
    return response.data;
  }

  return response;
}

function normalizeBackendReferenceMetadataResponse(response = {}, referenceTrack = {}) {
  const metadata = unwrapReferenceMetadataResponse(response);

  if (!metadata) return null;

  return normalizeProviderMetadata(metadata, referenceTrack, metadata.sourceType || "backend");
}

async function getReferenceMetadataFromBackend(referenceTrack = {}, { endpoint = getReferenceMetadataEndpoint(), fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== "function") return null;

  const request = buildReferenceMetadataRequest(referenceTrack);
  const validation = validateReferenceMetadataRequest(request);

  if (!validation.isValid) return null;

  const requestUrl = buildReferenceMetadataUrl(referenceTrack, endpoint);
  const response = await fetchImpl(requestUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response?.ok) return null;

  const payload = await response.json();

  return normalizeBackendReferenceMetadataResponse(payload, referenceTrack);
}

export {
  DEFAULT_REFERENCE_METADATA_ENDPOINT,
  buildReferenceMetadataRequest,
  buildReferenceMetadataUrl,
  getReferenceMetadataEndpoint,
  getReferenceMetadataFromBackend,
  normalizeBackendReferenceMetadataResponse,
  unwrapReferenceMetadataResponse,
  validateReferenceMetadataRequest,
};
