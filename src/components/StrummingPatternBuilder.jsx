import * as React from "react";
import { DOWN_STRUM, UP_STRUM } from "../constants";
import {
  STRUMMING_PRESETS,
  STRUMMING_SUBDIVISION_OPTIONS,
  clearStrummingPattern,
  createPresetStrummingPattern,
  normalizeStrummingPatternData,
  setStrummingSlotDirection,
  setStrummingSubdivision,
} from "../utils/strummingUtils";
import StrummingPatternDisplay from "./StrummingPatternDisplay";

const { useMemo } = React;

export default function StrummingPatternBuilder({ value, onChange }) {
  const patternData = useMemo(() => normalizeStrummingPatternData(value), [value]);
  const pattern = patternData.slots;
  const isSixteenth = patternData.subdivision === "sixteenth";

  function handleSetDirection(slot, direction) {
    onChange(setStrummingSlotDirection(patternData, slot, direction));
  }

  function handleSubdivisionChange(subdivision) {
    onChange(setStrummingSubdivision(patternData, subdivision));
  }

  function handleClearPattern() {
    onChange(clearStrummingPattern(patternData));
  }

  function handleApplyPreset(preset) {
    onChange(createPresetStrummingPattern(preset));
  }

  function isPresetActive(preset) {
    const presetPattern = createPresetStrummingPattern(preset);

    if (presetPattern.subdivision !== patternData.subdivision) {
      return false;
    }

    if (presetPattern.slots.length !== pattern.length) {
      return false;
    }

    return presetPattern.slots.every((slot, index) => {
      return slot.direction === (pattern[index]?.direction || "");
    });
  }

  return (
    <div className={`strumming-builder ${isSixteenth ? "is-sixteenth" : "is-eighth"}`}>
      <div>
        <span>Strumming Pattern</span>
        <p>Choose 8th-note or 16th-note timing, then place down and up strums on the beat grid. Click a selected direction again to clear that slot.</p>
      </div>

      <div className="strumming-subdivision-toggle" aria-label="Strumming subdivision">
        {STRUMMING_SUBDIVISION_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={patternData.subdivision === option.id ? "selected-button" : "ghost-button"}
            title={option.description}
            onClick={() => handleSubdivisionChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <StrummingPatternDisplay pattern={patternData} />

      <div className="custom-song-preview">
        <span>Presets</span>
        <div className="strumming-preset-row">
          {STRUMMING_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`preset-button ${isPresetActive(preset) ? "is-active" : ""}`}
              title={preset.description}
              onClick={() => handleApplyPreset(preset)}
            >
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

      <button type="button" className="danger-button" onClick={handleClearPattern}>
        Clear Pattern
      </button>
    </div>
  );
}
