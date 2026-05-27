import * as React from "react";

const { Fragment } = React;

const STRING_COUNT = 6;
const FRET_COUNT = 5;

export default function ChordDiagram({ chordName, diagram }) {
  if (!diagram) {
    return (
      <div className="chord-diagram chord-diagram-empty">
        <span>No diagram yet</span>
      </div>
    );
  }

  const { frets, fingers = [], startFret = 1 } = diagram;
  const maxFret = Math.max(...frets.filter((fret) => fret > 0), 1);
  const shouldShowStartFret = startFret > 1 || maxFret > FRET_COUNT;

  return (
    <div className="chord-diagram" aria-label={`${chordName} chord diagram`}>
      <div className="chord-diagram-name">{chordName}</div>

      <svg viewBox="0 0 180 210" role="img" aria-hidden="true">
        {shouldShowStartFret ? (
          <text x="8" y="54" className="fret-label">
            {startFret}fr
          </text>
        ) : null}

        {Array.from({ length: STRING_COUNT }, (_, index) => {
          const x = 42 + index * 20;

          return <line key={`string-${index}`} x1={x} y1="42" x2={x} y2="162" className="guitar-string" />;
        })}

        {Array.from({ length: FRET_COUNT + 1 }, (_, index) => {
          const y = 42 + index * 24;
          const isNut = index === 0 && !shouldShowStartFret;

          return <line key={`fret-${index}`} x1="42" y1={y} x2="142" y2={y} className={isNut ? "guitar-nut" : "guitar-fret"} />;
        })}

        {frets.map((fret, stringIndex) => {
          const x = 42 + stringIndex * 20;

          if (fret === -1) {
            return (
              <text key={`muted-${stringIndex}`} x={x} y="28" className="string-marker">
                ×
              </text>
            );
          }

          if (fret === 0) {
            return <circle key={`open-${stringIndex}`} cx={x} cy="23" r="5" className="open-string" />;
          }

          const relativeFret = fret - startFret + 1;
          const y = 42 + relativeFret * 24 - 12;
          const finger = fingers[stringIndex];

          return (
            <Fragment key={`note-${stringIndex}`}>
              <circle cx={x} cy={y} r="9" className="fretted-note" />
              {finger ? (
                <text x={x} y={y + 4} className="finger-label">
                  {finger}
                </text>
              ) : null}
            </Fragment>
          );
        })}
      </svg>
    </div>
  );
}
