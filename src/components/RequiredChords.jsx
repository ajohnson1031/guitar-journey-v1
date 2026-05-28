import * as React from "react";
import { CHORD_DETAILS, CHORD_DIAGRAMS } from "../constants";
import ChordDiagram from "./ChordDiagram";

const { Fragment } = React;

export default function RequiredChords({ selectedSong }) {
  return (
    <Fragment>
      <section className="panel-card">
        <h2>Required Chords</h2>
        <p className="section-copy">Practice these before attempting the full song.</p>

        <div className="chord-grid">
          {selectedSong.chords.map((chord) => (
            <div key={chord} className="chord-card">
              <div className="chord-card-header">
                <div>
                  <strong>{chord}</strong>
                  <span>{CHORD_DETAILS[chord]?.level || "Custom"}</span>
                </div>
              </div>

              <ChordDiagram chordName={chord} diagram={CHORD_DIAGRAMS[chord]} />

              <p>{CHORD_DETAILS[chord]?.tip || "No diagram/tip yet. Practice slowly and listen for clean ringing notes."}</p>
            </div>
          ))}
        </div>
      </section>
    </Fragment>
  );
}
