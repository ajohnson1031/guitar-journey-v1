const FIELD_DETECTION_STATUSES = {
  accepted: {
    className: "is-accepted",
    label: "Accepted",
    requiresAction: false,
  },
  detected: {
    className: "is-detected",
    label: "Detected",
    requiresAction: false,
  },
  manual: {
    className: "is-manual",
    label: "Manual",
    requiresAction: false,
  },
  missing: {
    className: "is-missing",
    label: "Missing",
    requiresAction: true,
  },
  "needs-review": {
    className: "is-needs-review",
    label: "Needs review",
    requiresAction: true,
  },
  overridden: {
    className: "is-overridden",
    label: "Overridden",
    requiresAction: false,
  },
};

function hasFieldDetectionValue(value) {
  if (Array.isArray(value)) return value.length > 0;

  return Boolean(String(value || "").trim());
}

function normalizeFieldDetectionStatus(status, hasValue) {
  if (status && FIELD_DETECTION_STATUSES[status]) return status;

  return hasValue ? "manual" : "missing";
}

function createFieldDetectionStatus({ message = "", sourceLabel = "", status = "", value } = {}) {
  const hasValue = hasFieldDetectionValue(value);
  const normalizedStatus = normalizeFieldDetectionStatus(status, hasValue);
  const statusConfig = FIELD_DETECTION_STATUSES[normalizedStatus] || FIELD_DETECTION_STATUSES.missing;
  const description = hasValue
    ? sourceLabel ||
      (normalizedStatus === "accepted"
        ? "Accepted for saving."
        : normalizedStatus === "manual"
          ? "Entered manually."
          : normalizedStatus === "overridden"
            ? "Edited after detection."
            : "Review before saving.")
    : message || "Could not be automatically detected. Add manually.";
  const canAccept = hasValue && (normalizedStatus === "detected" || normalizedStatus === "needs-review");

  return {
    ...statusConfig,
    canAccept,
    description,
    hasValue,
    sourceLabel,
    status: normalizedStatus,
  };
}

function getFieldDetectionStatusClassName(status) {
  return FIELD_DETECTION_STATUSES[status]?.className || FIELD_DETECTION_STATUSES.missing.className;
}

export {
  FIELD_DETECTION_STATUSES,
  createFieldDetectionStatus,
  getFieldDetectionStatusClassName,
  hasFieldDetectionValue,
};
