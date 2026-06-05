import * as React from "react";
import { DOWN_STRUM, UP_STRUM } from "../constants";
import { REST_STRUM, normalizeStrummingPatternData } from "../utils/strummingUtils";

const { Fragment } = React;

function getDirectionClass(direction) {
  if (direction === DOWN_STRUM) return "is-down";
  if (direction === UP_STRUM) return "is-up";

  return "";
}

function getBeatLabel(beat, compact) {
  if (!compact) return beat;

  return beat === "e" || beat === "a" ? "" : beat;
}

function shouldHighlightSlot(slot, activeBeat, activeSlot) {
  if (!slot.direction) return false;

  if (activeSlot !== null && activeSlot !== undefined) {
    return slot.slot === activeSlot;
  }

  if (!activeBeat) return false;

  return String(slot.beat) === String(activeBeat);
}

export default function StrummingPatternDisplay({ activeBeat = null, activeSlot = null, pattern, compact = false }) {
  const patternData = normalizeStrummingPatternData(pattern);
  const slots = patternData.slots;

  return (
    <Fragment>
      <div
        className={`strumming-pattern-display ${compact ? "is-compact" : ""} is-${patternData.subdivision}`}
        style={{ "--strumming-slot-count": slots.length }}
      >
        <div className="strumming-slot-display-grid" aria-label="Strumming pattern">
          {slots.map((slot) => {
            const isActiveStrokeSlot = shouldHighlightSlot(slot, activeBeat, activeSlot);

            return (
              <span key={`slot-${slot.slot}`} className={`strumming-display-slot ${isActiveStrokeSlot ? "is-current-beat" : ""}`}>
                <span className={`strumming-direction ${slot.direction ? "is-active" : ""} ${getDirectionClass(slot.direction)}`}>
                  {slot.direction || REST_STRUM}
                </span>

                <span className="strumming-beat-label" aria-label={slot.beat}>
                  {getBeatLabel(slot.beat, compact)}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </Fragment>
  );
}
