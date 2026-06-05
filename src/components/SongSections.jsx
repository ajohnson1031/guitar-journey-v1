import * as React from "react";
import useSharedMetronomeState from "../hooks/useSharedMetronomeState";
import useStrummingPlayback from "../hooks/useStrummingPlayback";
import useTempoOverride from "../hooks/useTempoOverride";
import SongPlaythroughPreview from "./SongPlaythroughPreview";
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
          <div>
            <p className="eyebrow">Practice Detail</p>
            <h2>Song Sections</h2>
            <p className="section-copy">Break the song into manageable pieces before the full playthrough.</p>
          </div>

          <span className="strum-pill strum-pattern-pill">
            <span>Strum Pattern:</span>
            <StrummingPatternDisplay activeSlot={isMetronomeRunning ? strummingPlayback.activeSlot : null} pattern={selectedStrummingPattern} compact />
          </span>
        </div>

        <SongPlaythroughPreview selectedSong={selectedSong} />

        <div className="section-list">
          {selectedSong.sections.map((section) => (
            <div key={`${section.name}-${section.progression}`} className="song-section-card">
              <span>{section.name}</span>
              <strong>{section.progression}</strong>
            </div>
          ))}
        </div>
      </section>
    </Fragment>
  );
}
