import * as React from "react";
import { Link } from "react-router-dom";
import useSharedMetronomeState from "../hooks/useSharedMetronomeState";
import useStrummingPlayback from "../hooks/useStrummingPlayback";
import useTempoOverride from "../hooks/useTempoOverride";
import { buildReferenceTimestampUrl, formatReferenceMarkerTime, getReferenceMarkerForSection } from "../utils/referenceMarkerUtils";
import { EditIcon } from "./AppIcons";
import ReferenceTrackCard from "./ReferenceTrackCard";
import SongPlaythroughPreview from "./SongPlaythroughPreview";
import TimedPracticeArrangement from "./TimedPracticeArrangement";
import StrummingPatternDisplay from "./StrummingPatternDisplay";

const { Fragment } = React;

export default function SongSections({ selectedSong }) {
  const { isMetronomeRunning, metronomeStartAtMs } = useSharedMetronomeState();
  const tempo = useTempoOverride(selectedSong);
  const selectedStrummingPattern = selectedSong.strummingPattern || selectedSong.strumming;
  const strummingPlayback = useStrummingPlayback({
    bpm: tempo.effectiveBpm,
    isRunning: isMetronomeRunning,
    pattern: selectedStrummingPattern,
    startAtMs: metronomeStartAtMs,
  });

  return (
    <Fragment>
      <section className="panel-card detail-section-card">
        <div className="section-heading-row">
          <div className="song-sections-heading-copy">
            <p className="eyebrow">Practice Detail</p>

            <div className="song-sections-title-action-row">
              <h2>Song Sections</h2>

              {selectedSong.isCustom ? (
                <Link className="song-sections-edit-link" to={`/songs/edit/${selectedSong.id}`}>
                  <EditIcon />
                  <span>Edit Song</span>
                </Link>
              ) : null}
            </div>

            <p className="section-copy">Break the song into manageable pieces before the full playthrough.</p>
          </div>

          <span className="strum-pill strum-pattern-pill">
            <span>Strum Pattern:</span>
            <StrummingPatternDisplay activeSlot={isMetronomeRunning ? strummingPlayback.activeSlot : null} pattern={selectedStrummingPattern} compact />
          </span>
        </div>

        <ReferenceTrackCard markers={selectedSong.referenceMarkers} referenceTrack={selectedSong.referenceTrack} showEmbed sourceUrl={selectedSong.sourceUrl} />

        <TimedPracticeArrangement selectedSong={selectedSong} />

        <SongPlaythroughPreview selectedSong={selectedSong} />

        <div className="section-list">
          {selectedSong.sections.map((section) => {
            const sectionMarker = getReferenceMarkerForSection(selectedSong.referenceMarkers, section.name);
            const referenceUrl = sectionMarker ? buildReferenceTimestampUrl(selectedSong.referenceTrack || { url: selectedSong.sourceUrl, platform: "generic" }, sectionMarker.seconds) : "";

            return (
              <div key={`${section.name}-${section.progression}`} className="song-section-card">
                <div className="song-section-card-header">
                  <span>{section.name}</span>
                  {sectionMarker ? (
                    <a className="song-section-reference-link" href={referenceUrl} target="_blank" rel="noreferrer">
                      {formatReferenceMarkerTime(sectionMarker.seconds)}
                    </a>
                  ) : null}
                </div>
                <strong>{section.progression}</strong>
              </div>
            );
          })}
        </div>
      </section>
    </Fragment>
  );
}
