import * as React from "react";
import {
  getReferenceMetadataDebugPayload,
  stringifyReferenceMetadataDebugPayload,
} from "../utils/referenceMetadataDebugUtils";
import { getReferenceMetadataSourceLabel } from "../utils/referenceMetadataSourceUtils";

const { useMemo } = React;

export default function ReferenceMetadataDebugPanel({
  metadata = null,
  metadataStatus = {},
  referenceTrack = {},
}) {
  const debugPayload = useMemo(
    () =>
      getReferenceMetadataDebugPayload({
        metadata,
        metadataStatus,
        referenceTrack,
      }),
    [metadata, metadataStatus, referenceTrack],
  );

  if (!import.meta.env.DEV) return null;
  if (!metadata && !metadataStatus?.message && !referenceTrack?.url) return null;

  const sourceLabel = metadata ? getReferenceMetadataSourceLabel(metadata) : metadataStatus?.sourceLabel || "Pending";
  const debugJson = stringifyReferenceMetadataDebugPayload(debugPayload);

  return (
    <details className="reference-metadata-debug-panel">
      <summary>
        <span>Metadata debug</span>
        <span>{sourceLabel}</span>
      </summary>

      <pre>{debugJson}</pre>
    </details>
  );
}
