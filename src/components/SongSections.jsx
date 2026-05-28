import * as React from "react";

const { Fragment } = React;

function isArrowStrummingPattern(value) {
  return /^[↓↑\s]+$/.test(String(value || "").trim());
}

function StrummingPatternDisplay({ pattern }) {
  if (!isArrowStrummingPattern(pattern)) {
    return <span>{pattern}</span>;
  }

  return (
    <span className="inline-strumming-display" aria-label="Strumming pattern">
      {String(pattern)
        .trim()
        .split(/\s+/)
        .map((direction, index) => (
          <strong key={`${direction}-${index}`} className={direction === "↓" ? "strum-down" : "strum-up"}>
            {direction}
          </strong>
        ))}
    </span>
  );
}

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
            <span>Strum:</span>
            <StrummingPatternDisplay pattern={selectedSong.strumming} />
          </span>
        </div>

        <div className="section-list">
          {selectedSong.sections.map((section) => (
            <div key={section.name} className="song-section-card">
              <span>{section.name}</span>
              <strong>{section.progression}</strong>
            </div>
          ))}
        </div>
      </section>
    </Fragment>
  );
}
