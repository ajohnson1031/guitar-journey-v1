import * as React from "react";
import { CHORD_DETAILS } from "../constants";
import { getChordDiagram } from "../utils/chordDiagramUtils";
import ChordDiagram from "./ChordDiagram";

const { Fragment } = React;

export default function RequiredChords({ selectedSong }) {
  return (
    <Fragment>
      <section className="panel-card">
        <h2>Required Chords</h2>
        <p className="section-copy">Practice these before attempting the full song.</p>

        <div className="chord-grid">
          {selectedSong.chords.map((chord) => {
            const chordDetail = CHORD_DETAILS[chord];
            const diagram = getChordDiagram(chord);

            return (
              <div key={chord} className="chord-card">
                <div className="chord-card-header">
                  <div>
                    <strong>{chord}</strong>
                    <span>{chordDetail?.level || (diagram ? "Auto shape" : "Custom")}</span>
                  </div>
                </div>

                <ChordDiagram chordName={chord} diagram={diagram} />

                <p>
                  {chordDetail?.tip ||
                    (diagram
                      ? "Generated from a common movable chord shape. Adjust fingering as needed."
                      : "No diagram/tip yet. Practice slowly and listen for clean ringing notes.")}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </Fragment>
  );
}
