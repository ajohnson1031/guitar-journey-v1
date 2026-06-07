const SOURCE_LABELS = {
  backend: "Backend",
  "backend-mock": "Backend Mock",
  mock: "Mock Provider",
  oembed: "oEmbed",
  provider: "Provider",
  manual: "Manual",
  unknown: "Unknown",
};

const SOURCE_DESCRIPTIONS = {
  backend: "Returned by /api/reference-metadata.",
  "backend-mock": "Returned by the local dev metadata endpoint.",
  mock: "Returned by the frontend mock provider.",
  oembed: "Returned by provider oEmbed fallback.",
  provider: "Returned by a provider adapter.",
  manual: "Entered manually or not auto-detected.",
  unknown: "Metadata source has not been identified.",
};

function normalizeMetadataSourceType(value) {
  const sourceType = String(value || "").trim().toLowerCase();

  if (!sourceType) return "unknown";
  if (sourceType === "backend-mock" || sourceType === "backend_mock") return "backend-mock";
  if (sourceType === "oembed" || sourceType === "o-embed") return "oembed";
  if (sourceType === "mock") return "mock";
  if (sourceType === "backend") return "backend";
  if (sourceType === "provider") return "provider";
  if (sourceType === "manual") return "manual";

  return sourceType;
}

function getReferenceMetadataSourceType(metadataOrSourceType) {
  if (!metadataOrSourceType) return "unknown";

  if (typeof metadataOrSourceType === "string") {
    return normalizeMetadataSourceType(metadataOrSourceType);
  }

  return normalizeMetadataSourceType(metadataOrSourceType.sourceType || metadataOrSourceType.metadataSource || metadataOrSourceType.source);
}

function getReferenceMetadataSourceLabel(metadataOrSourceType) {
  const sourceType = getReferenceMetadataSourceType(metadataOrSourceType);

  return SOURCE_LABELS[sourceType] || SOURCE_LABELS.unknown;
}

function getReferenceMetadataSourceDescription(metadataOrSourceType) {
  const sourceType = getReferenceMetadataSourceType(metadataOrSourceType);

  return SOURCE_DESCRIPTIONS[sourceType] || SOURCE_DESCRIPTIONS.unknown;
}

function getReferenceMetadataSourceClassName(metadataOrSourceType) {
  const sourceType = getReferenceMetadataSourceType(metadataOrSourceType);

  return `is-${sourceType.replace(/[^a-z0-9]+/g, "-") || "unknown"}`;
}

function createReferenceMetadataSourceStatus(metadata) {
  const sourceType = getReferenceMetadataSourceType(metadata);

  return {
    description: getReferenceMetadataSourceDescription(sourceType),
    label: getReferenceMetadataSourceLabel(sourceType),
    sourceType,
  };
}

export {
  createReferenceMetadataSourceStatus,
  getReferenceMetadataSourceClassName,
  getReferenceMetadataSourceDescription,
  getReferenceMetadataSourceLabel,
  getReferenceMetadataSourceType,
  normalizeMetadataSourceType,
};
