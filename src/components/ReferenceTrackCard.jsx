import * as React from "react";
import { ExternalLinkIcon } from "./AppIcons";
import ReferenceServiceLogo from "./ReferenceServiceLogo";
import { parseReferenceTrackUrl } from "../utils/referenceTrackUtils";
import { buildReferenceTimestampUrl, normalizeReferenceMarkers } from "../utils/referenceMarkerUtils";

const { useMemo } = React;

function getResolvedReferenceTrack({ referenceTrack, sourceUrl }) {
  if (referenceTrack?.url) {
    return {
      ...parseReferenceTrackUrl(referenceTrack.url),
      ...referenceTrack,
      isEmpty: false,
      isValid: true,
      url: referenceTrack.url,
    };
  }

  return parseReferenceTrackUrl(sourceUrl);
}

export default function ReferenceTrackCard({ compact = false, markers = [], referenceTrack, showEmbed = false, sourceUrl }) {
  const resolvedReference = useMemo(() => getResolvedReferenceTrack({ referenceTrack, sourceUrl }), [referenceTrack, sourceUrl]);
  const normalizedMarkers = useMemo(() => normalizeReferenceMarkers(markers), [markers]);
  const hasReference = resolvedReference?.isValid && !resolvedReference.isEmpty;
  const canEmbed = Boolean(showEmbed && resolvedReference?.embedUrl);

  if (!hasReference) return null;

  return (
    <article className={`song-reference-track-card ${compact ? "is-compact" : ""} ${canEmbed ? "has-embed" : ""}`}>
      <div className="song-reference-track-header">
        {resolvedReference.thumbnailUrl ? (
          <img className={`song-reference-thumbnail ${compact ? "is-compact" : ""}`} src={resolvedReference.thumbnailUrl} alt="" loading="lazy" />
        ) : (
          <ReferenceServiceLogo isLarge={!compact} platform={resolvedReference.platform} platformLabel={resolvedReference.platformLabel} />
        )}

        <div className="song-reference-track-copy">
          <p className="eyebrow">Reference Track</p>
          <h3>{resolvedReference.title || `${resolvedReference.platformLabel} ${resolvedReference.kind ? resolvedReference.kind : "link"}`}</h3>
          <p>
            {resolvedReference.authorName ? `${resolvedReference.authorName} · ` : ""}
            {resolvedReference.url}
          </p>
        </div>

        <a className="song-reference-track-action" href={resolvedReference.url} target="_blank" rel="noreferrer" aria-label="Open reference track" title="Open reference track">
          <ExternalLinkIcon />
          <span>Open</span>
        </a>
      </div>

      {canEmbed ? (
        <div className="song-reference-track-embed">
          <iframe
            title={`${resolvedReference.platformLabel} reference player`}
            src={resolvedReference.embedUrl}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : null}

      {normalizedMarkers.length ? (
        <div className="song-reference-marker-list" aria-label="Reference section markers">
          {normalizedMarkers.map((marker) => (
            <a key={marker.id} href={buildReferenceTimestampUrl(resolvedReference, marker.seconds)} target="_blank" rel="noreferrer" className="song-reference-marker-pill">
              <span>{marker.label}</span>
              <strong>{marker.time}</strong>
            </a>
          ))}
        </div>
      ) : null}
    </article>
  );
}
