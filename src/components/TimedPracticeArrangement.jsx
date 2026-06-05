import * as React from "react";
import { buildReferenceTimestampUrl, formatReferenceMarkerTime } from "../utils/referenceMarkerUtils";
import { createTimedPracticeArrangement, getArrangementCompletionLabel } from "../utils/timedPracticeArrangementUtils";
import { ExternalLinkIcon } from "./AppIcons";

const { useMemo } = React;

export default function TimedPracticeArrangement({ selectedSong }) {
  const arrangement = useMemo(() => createTimedPracticeArrangement(selectedSong), [selectedSong]);

  if (!arrangement.hasReference && !arrangement.hasMarkers) return null;
  if (!arrangement.totalSections) return null;

  return (
    <section className="timed-practice-arrangement-card">
      <div className="timed-practice-arrangement-header">
        <div>
          <p className="eyebrow">Reference Timing</p>
          <h3>Timed Practice Arrangement</h3>
          <p>Connect saved section markers to your practice sections. This becomes the timing map for future arrangement-based playback.</p>
        </div>

        <div className="timed-practice-arrangement-meta">
          <span>{getArrangementCompletionLabel(arrangement)}</span>
          {arrangement.missingSectionsCount ? <span>{arrangement.missingSectionsCount} missing</span> : <span>Ready</span>}
        </div>
      </div>

      <div className="timed-practice-section-list">
        {arrangement.sections.map((section) => (
          <article key={section.id} className={`timed-practice-section-card ${section.isTimed ? "is-timed" : "is-missing"}`}>
            <div className="timed-practice-section-index">{section.index + 1}</div>

            <div className="timed-practice-section-copy">
              <div className="timed-practice-section-title-row">
                <strong>{section.name}</strong>

                {section.isTimed ? (
                  <a className="timed-practice-time-pill" href={section.referenceUrl} target="_blank" rel="noreferrer">
                    <ExternalLinkIcon />
                    <span>{section.startTime}</span>
                  </a>
                ) : (
                  <span className="timed-practice-missing-pill">No marker</span>
                )}
              </div>

              <p>{section.progression || "No progression listed."}</p>

              {section.isTimed ? (
                <small>
                  Starts at {section.startTime}
                  {section.durationText ? ` · estimated section length ${section.durationText}` : " · add the next marker to estimate this section length"}
                </small>
              ) : (
                <small>Add a reference marker like “{section.name}: 0:00” in the song editor.</small>
              )}
            </div>
          </article>
        ))}
      </div>

      {arrangement.unassignedMarkers.length ? (
        <div className="timed-practice-unassigned-markers">
          <span>Other markers</span>

          <div>
            {arrangement.unassignedMarkers.map((marker) => {
              const markerUrl = arrangement.referenceTrack ? buildReferenceTimestampUrl(arrangement.referenceTrack, marker.seconds) : "";

              return markerUrl ? (
                <a key={marker.id} href={markerUrl} target="_blank" rel="noreferrer">
                  {marker.label} · {formatReferenceMarkerTime(marker.seconds)}
                </a>
              ) : (
                <span key={marker.id}>
                  {marker.label} · {formatReferenceMarkerTime(marker.seconds)}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
