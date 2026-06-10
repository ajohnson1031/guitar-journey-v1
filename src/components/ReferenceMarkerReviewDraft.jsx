import * as React from "react";
import {
  getDetectedMarkerPreviewText,
  getDetectedMarkerReviewStats,
  getDetectedMarkerReviewSummary,
} from "../utils/referenceMarkerReviewUtils";

const { useMemo } = React;

export default function ReferenceMarkerReviewDraft({
  currentMarkerText = "",
  markers = [],
  onApply,
  onDismiss,
  sourceLabel = "",
}) {
  const stats = useMemo(
    () =>
      getDetectedMarkerReviewStats({
        currentMarkerText,
        markers,
      }),
    [currentMarkerText, markers],
  );
  const summary = useMemo(
    () =>
      getDetectedMarkerReviewSummary({
        currentMarkerText,
        markers,
      }),
    [currentMarkerText, markers],
  );
  const previewText = useMemo(() => getDetectedMarkerPreviewText(markers), [markers]);

  if (!markers.length) return null;

  return (
    <section className={`reference-marker-review-draft ${stats.isFullyApplied ? "is-applied" : ""}`}>
      <div className="reference-marker-review-draft-header">
        <div>
          <p className="eyebrow">Suggested Markers</p>
          <h4>Review detected section timing</h4>
          <p>{summary}</p>
        </div>

        <div className="reference-marker-review-badges">
          {sourceLabel ? <span>{sourceLabel}</span> : null}
          <span>{markers.length} marker{markers.length === 1 ? "" : "s"}</span>
        </div>
      </div>

      {previewText ? <p className="reference-marker-review-preview">{previewText}</p> : null}

      <ol className="reference-marker-review-list">
        {markers.map((marker, index) => (
          <li key={marker.id || `${marker.label}-${marker.seconds}-${index}`}>
            <span>{marker.time}</span>
            <strong>{marker.label}</strong>
          </li>
        ))}
      </ol>

      <div className="reference-marker-review-actions">
        <button
          type="button"
          className="reference-marker-review-apply-button"
          onClick={onApply}
          disabled={stats.isFullyApplied}
        >
          {stats.isFullyApplied ? "Markers applied" : "Apply detected markers"}
        </button>

        <button type="button" className="reference-marker-review-dismiss-button" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </section>
  );
}
