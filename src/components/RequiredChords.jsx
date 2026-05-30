import * as React from "react";
import { CHORD_DETAILS } from "../constants";
import { getChordDiagram } from "../utils/chordDiagramUtils";
import { playChordSample } from "../utils/chordAudioUtils";
import ChordDiagram from "./ChordDiagram";

const { Fragment, useEffect, useRef, useState } = React;

export default function RequiredChords({ selectedSong }) {
  const [playingChord, setPlayingChord] = useState("");
  const clearPlayingChordTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (clearPlayingChordTimerRef.current) {
        window.clearTimeout(clearPlayingChordTimerRef.current);
      }
    };
  }, []);

  async function handlePlayChord(chord) {
    if (clearPlayingChordTimerRef.current) {
      window.clearTimeout(clearPlayingChordTimerRef.current);
    }

    const didPlay = await playChordSample(chord);

    if (!didPlay) return;

    setPlayingChord(chord);

    clearPlayingChordTimerRef.current = window.setTimeout(() => {
      setPlayingChord("");
    }, 1100);
  }

  return (
    <Fragment>
      <section className="panel-card">
        <h2>Required Chords</h2>
        <p className="section-copy">Practice these before attempting the full song.</p>

        <div className="chord-grid">
          {selectedSong.chords.map((chord) => {
            const chordDetail = CHORD_DETAILS[chord];
            const diagram = getChordDiagram(chord);
            const isPlaying = playingChord === chord;

            return (
              <div key={chord} className="chord-card">
                <div className="chord-card-header">
                  <div>
                    <strong>{chord}</strong>
                    <span>{chordDetail?.level || (diagram ? "Auto shape" : "Custom")}</span>
                  </div>

                  <button
                    type="button"
                    className={`chord-audio-button ${isPlaying ? "is-playing" : ""}`}
                    title={`Play ${chord} chord sample`}
                    aria-label={`Play ${chord} chord sample`}
                    onClick={() => handlePlayChord(chord)}
                  >
                    <PlayIcon />
                  </button>
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

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8 5.75v12.5L18 12 8 5.75Z" />
    </svg>
  );
}
