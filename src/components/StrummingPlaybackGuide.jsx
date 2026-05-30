import * as React from "react";
import { getStrummingDirectionClass, getStrummingDirectionLabel } from "../hooks/useStrummingPlayback";
import { REST_STRUM } from "../utils/strummingUtils";

const { Fragment } = React;

export default function StrummingPlaybackGuide({ activeSlot = 0, isRunning = false, slots = [], subdivision = "eighth" }) {
  const displaySlots = slots.length ? slots : [];
  const active = displaySlots[activeSlot] || displaySlots[0];
  const activeDirectionClass = getStrummingDirectionClass(active?.direction);
  const activeDirectionLabel = getStrummingDirectionLabel(active?.direction);
  const activeBeat = active?.beat || "1";

  return (
    <Fragment>
      <div className={`strumming-playback-guide ${isRunning ? "is-running" : "is-idle"} is-${subdivision}`}>
        <div className="strumming-playback-header">
          <span>Strumming Guide</span>

          <strong className={`strumming-playback-cue ${activeDirectionClass}`}>{`${activeDirectionLabel} on ${activeBeat}`}</strong>
        </div>

        <div className="strumming-playback-grid" aria-label="Strumming playback guide">
          {displaySlots.map((slot) => {
            const directionClass = getStrummingDirectionClass(slot.direction);
            const isActive = slot.slot === activeSlot;

            return (
              <div key={slot.slot} className={`strumming-playback-slot ${directionClass} ${isActive ? "is-active" : ""}`}>
                <div className="strumming-playback-slot-stack">
                  <span className="strumming-playback-slot-direction">{slot.direction || REST_STRUM}</span>
                  <span className="strumming-playback-slot-beat">{slot.beat}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Fragment>
  );
}
