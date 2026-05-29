import * as React from "react";
import { DOWN_STRUM, UP_STRUM } from "../constants";
import { REST_STRUM, normalizeStrummingPattern } from "../utils/strummingUtils";

const { Fragment } = React;

function getDirectionClass(direction) {
  if (direction === DOWN_STRUM) return "is-down";
  if (direction === UP_STRUM) return "is-up";

  return "";
}

export default function StrummingPatternDisplay({ pattern, compact = false }) {
  const slots = normalizeStrummingPattern(pattern);

  return (
    <div className={`strumming-pattern-display ${compact ? "is-compact" : ""}`}>
      <div className="strumming-arrow-row" aria-label="Strumming directions">
        {slots.map((slot) => (
          <span key={`direction-${slot.slot}`} className={`strumming-direction ${slot.direction ? "is-active" : ""} ${getDirectionClass(slot.direction)}`}>
            {slot.direction || REST_STRUM}
          </span>
        ))}
      </div>

      <div className="strumming-beat-row" aria-label="Beat counts">
        {slots.map((slot) => (
          <span key={`beat-${slot.slot}`}>{slot.beat}</span>
        ))}
      </div>
    </div>
  );
}
