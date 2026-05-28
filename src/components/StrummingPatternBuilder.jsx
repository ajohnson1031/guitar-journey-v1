import * as React from "react";

const { Fragment } = React;

const DOWN_STRUM = "↓";
const UP_STRUM = "↑";

export default function StrummingPatternBuilder({ value, onChange }) {
  const pattern = Array.isArray(value) ? value : [];

  function addStrum(direction) {
    onChange([...pattern, direction]);
  }

  function undoLastStrum() {
    onChange(pattern.slice(0, -1));
  }

  function clearStrummingPattern() {
    onChange([]);
  }

  return (
    <div className="strumming-builder">
      <div>
        <span>Strumming Pattern</span>
        <p>Tap down/up arrows to build the rhythm sequence.</p>
      </div>

      <div className="strumming-display" aria-label="Selected strumming pattern">
        {pattern.length ? (
          pattern.map((direction, index) => (
            <strong key={`${direction}-${index}`} className={direction === DOWN_STRUM ? "strum-down" : "strum-up"}>
              {direction}
            </strong>
          ))
        ) : (
          <small>No strumming pattern yet</small>
        )}
      </div>

      <div className="strumming-actions">
        <button type="button" className="strum-arrow-button strum-down-button" onClick={() => addStrum(DOWN_STRUM)} aria-label="Add down strum">
          {DOWN_STRUM}
        </button>

        <button type="button" className="strum-arrow-button strum-up-button" onClick={() => addStrum(UP_STRUM)} aria-label="Add up strum">
          {UP_STRUM}
        </button>

        <button type="button" className="ghost-button" onClick={undoLastStrum}>
          Undo
        </button>

        <button type="button" className="danger-button" onClick={clearStrummingPattern}>
          Clear
        </button>
      </div>
    </div>
  );
}
