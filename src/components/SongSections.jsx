import * as React from "react";
import StrummingPatternDisplay from "./StrummingPatternDisplay";

const { Fragment } = React;

export default function SongSections({ selectedSong }) {
  return (
    <Fragment>
      <section className="panel-card detail-section-card">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Practice Detail</p>
            <h2>Song Sections</h2>
            <p className="section-copy">Break the song into manageable pieces before the full playthrough.</p>
          </div>

          <span className="strum-pill">
            <span>Strum</span>
            <StrummingPatternDisplay pattern={selectedSong.strummingPattern || selectedSong.strumming} compact />
          </span>
        </div>

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
