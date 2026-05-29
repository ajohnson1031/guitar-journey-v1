import * as React from "react";
import { DOWN_STRUM, UP_STRUM } from "../constants";
import { STRUMMING_PRESETS, clearStrummingPattern, createPresetStrummingPattern, normalizeStrummingPattern, setStrummingSlotDirection } from "../utils/strummingUtils";
import StrummingPatternDisplay from "./StrummingPatternDisplay";

const { useMemo } = React;

export default function StrummingPatternBuilder({ value, onChange }) {
  const pattern = useMemo(() => normalizeStrummingPattern(value), [value]);

  function handleSetDirection(slot, direction) {
    onChange(setStrummingSlotDirection(pattern, slot, direction));
  }

  function handleClearPattern() {
    onChange(clearStrummingPattern());
  }

  function handleApplyPreset(preset) {
    onChange(createPresetStrummingPattern(preset));
  }

  return (
    <div className="strumming-builder">
      <div>
        <span>Strumming Pattern</span>
        <p>Place down and up strums on the beat grid. Click a selected direction again to clear that slot.</p>
      </div>

      <StrummingPatternDisplay pattern={pattern} />

      <div className="custom-song-preview">
        <span>Presets</span>

        <div>
          {STRUMMING_PRESETS.map((preset) => (
            <button key={preset.id} type="button" className="ghost-button" title={preset.description} onClick={() => handleApplyPreset(preset)}>
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="strumming-slot-grid">
        {pattern.map((slot) => (
          <div key={slot.slot} className="strumming-slot-card">
            <span>{slot.beat}</span>

            <div>
              <button
                type="button"
                className={`strum-arrow-button strum-down-button ${slot.direction === DOWN_STRUM ? "is-selected" : ""}`}
                title={`Set ${slot.beat} to down strum`}
                aria-label={`Set ${slot.beat} to down strum`}
                onClick={() => handleSetDirection(slot.slot, DOWN_STRUM)}
              >
                {DOWN_STRUM}
              </button>

              <button
                type="button"
                className={`strum-arrow-button strum-up-button ${slot.direction === UP_STRUM ? "is-selected" : ""}`}
                title={`Set ${slot.beat} to up strum`}
                aria-label={`Set ${slot.beat} to up strum`}
                onClick={() => handleSetDirection(slot.slot, UP_STRUM)}
              >
                {UP_STRUM}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="ghost-button" onClick={handleClearPattern}>
        Clear Pattern
      </button>
    </div>
  );
}
