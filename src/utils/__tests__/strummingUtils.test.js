import { describe, expect, it } from "vitest";
import { DOWN_STRUM, UP_STRUM } from "../../constants";
import {
  EIGHTH_STRUMMING_SUBDIVISION,
  REST_STRUM,
  SIXTEENTH_STRUMMING_SUBDIVISION,
  STRUMMING_PRESETS,
  clearStrummingPattern,
  createEmptyStrummingPatternData,
  createPresetStrummingPattern,
  getCompactStrummingPattern,
  getStrummingPatternSlotCount,
  getStrummingPatternSubdivision,
  getStrummingSlotDurationMs,
  getStrummingSlotsPerBeat,
  hasStrummingPattern,
  normalizeStrummingDirection,
  normalizeStrummingPattern,
  normalizeStrummingPatternData,
  normalizeStrummingSubdivision,
  serializeStrummingPattern,
  setStrummingSlotDirection,
  setStrummingSubdivision,
} from "../strummingUtils";

describe("strummingUtils", () => {
  it("defaults empty patterns to eighth-note subdivision", () => {
    const pattern = normalizeStrummingPatternData();

    expect(pattern.subdivision).toBe(EIGHTH_STRUMMING_SUBDIVISION);
    expect(pattern.slots).toHaveLength(8);
    expect(pattern.slots.map((slot) => slot.beat)).toEqual(["1", "&", "2", "&", "3", "&", "4", "&"]);
    expect(pattern.slots.every((slot) => slot.direction === "")).toBe(true);
  });

  it("creates an empty sixteenth-note pattern", () => {
    const pattern = createEmptyStrummingPatternData(SIXTEENTH_STRUMMING_SUBDIVISION);

    expect(pattern.subdivision).toBe(SIXTEENTH_STRUMMING_SUBDIVISION);
    expect(pattern.slots).toHaveLength(16);
    expect(pattern.slots.map((slot) => slot.beat)).toEqual(["1", "e", "&", "a", "2", "e", "&", "a", "3", "e", "&", "a", "4", "e", "&", "a"]);
  });

  it("normalizes old array-based eighth-note patterns", () => {
    const pattern = normalizeStrummingPatternData([DOWN_STRUM, "", DOWN_STRUM, UP_STRUM, UP_STRUM, DOWN_STRUM, DOWN_STRUM, UP_STRUM]);

    expect(pattern.subdivision).toBe(EIGHTH_STRUMMING_SUBDIVISION);
    expect(pattern.slots).toHaveLength(8);
    expect(pattern.slots.map((slot) => slot.direction)).toEqual([DOWN_STRUM, "", DOWN_STRUM, UP_STRUM, UP_STRUM, DOWN_STRUM, DOWN_STRUM, UP_STRUM]);
  });

  it("infers sixteenth-note subdivision from old array patterns longer than eight slots", () => {
    const pattern = normalizeStrummingPatternData([DOWN_STRUM, "", "", "", "", "", DOWN_STRUM, UP_STRUM, "", UP_STRUM, "", "", DOWN_STRUM, "", UP_STRUM, ""]);

    expect(pattern.subdivision).toBe(SIXTEENTH_STRUMMING_SUBDIVISION);
    expect(pattern.slots).toHaveLength(16);
    expect(pattern.slots[0].direction).toBe(DOWN_STRUM);
    expect(pattern.slots[6].direction).toBe(DOWN_STRUM);
    expect(pattern.slots[7].direction).toBe(UP_STRUM);
    expect(pattern.slots[14].direction).toBe(UP_STRUM);
  });

  it("normalizes string patterns as eighth-note patterns", () => {
    const pattern = normalizeStrummingPatternData(`${DOWN_STRUM} ${REST_STRUM} ${DOWN_STRUM} ${UP_STRUM}`);

    expect(pattern.subdivision).toBe(EIGHTH_STRUMMING_SUBDIVISION);
    expect(pattern.slots).toHaveLength(8);
    expect(pattern.slots.map((slot) => slot.direction)).toEqual([DOWN_STRUM, "", DOWN_STRUM, UP_STRUM, "", "", "", ""]);
  });

  it("preserves object-shaped v2 pattern subdivision", () => {
    const pattern = normalizeStrummingPatternData({
      subdivision: SIXTEENTH_STRUMMING_SUBDIVISION,
      slots: [
        { slot: 0, direction: DOWN_STRUM },
        { slot: 3, direction: UP_STRUM },
        { slot: 8, direction: DOWN_STRUM },
      ],
    });

    expect(pattern.subdivision).toBe(SIXTEENTH_STRUMMING_SUBDIVISION);
    expect(pattern.slots).toHaveLength(16);
    expect(pattern.slots[0].direction).toBe(DOWN_STRUM);
    expect(pattern.slots[3].direction).toBe(UP_STRUM);
    expect(pattern.slots[8].direction).toBe(DOWN_STRUM);
  });

  it("switches eighth-note patterns to sixteenth-note patterns while preserving matching timing slots", () => {
    const eighthPattern = normalizeStrummingPatternData([DOWN_STRUM, UP_STRUM, "", DOWN_STRUM, "", UP_STRUM, DOWN_STRUM, ""]);

    const sixteenthPattern = setStrummingSubdivision(eighthPattern, SIXTEENTH_STRUMMING_SUBDIVISION);

    expect(sixteenthPattern.subdivision).toBe(SIXTEENTH_STRUMMING_SUBDIVISION);
    expect(sixteenthPattern.slots).toHaveLength(16);

    expect(sixteenthPattern.slots[0].direction).toBe(DOWN_STRUM);
    expect(sixteenthPattern.slots[2].direction).toBe(UP_STRUM);
    expect(sixteenthPattern.slots[6].direction).toBe(DOWN_STRUM);
    expect(sixteenthPattern.slots[10].direction).toBe(UP_STRUM);
    expect(sixteenthPattern.slots[12].direction).toBe(DOWN_STRUM);

    expect(sixteenthPattern.slots[1].direction).toBe("");
    expect(sixteenthPattern.slots[3].direction).toBe("");
  });

  it("switches sixteenth-note patterns to eighth-note patterns while preserving beat-aligned slots", () => {
    const sixteenthPattern = normalizeStrummingPatternData({
      subdivision: SIXTEENTH_STRUMMING_SUBDIVISION,
      slots: [DOWN_STRUM, UP_STRUM, DOWN_STRUM, "", "", "", UP_STRUM, "", DOWN_STRUM, "", "", "", UP_STRUM, "", DOWN_STRUM, ""],
    });

    const eighthPattern = setStrummingSubdivision(sixteenthPattern, EIGHTH_STRUMMING_SUBDIVISION);

    expect(eighthPattern.subdivision).toBe(EIGHTH_STRUMMING_SUBDIVISION);
    expect(eighthPattern.slots).toHaveLength(8);

    expect(eighthPattern.slots.map((slot) => slot.direction)).toEqual([DOWN_STRUM, DOWN_STRUM, "", UP_STRUM, DOWN_STRUM, "", UP_STRUM, DOWN_STRUM]);
  });

  it("toggles strumming slot direction on and off", () => {
    const withDown = setStrummingSlotDirection(undefined, 0, DOWN_STRUM);

    expect(withDown.subdivision).toBe(EIGHTH_STRUMMING_SUBDIVISION);
    expect(withDown.slots[0].direction).toBe(DOWN_STRUM);

    const cleared = setStrummingSlotDirection(withDown, 0, DOWN_STRUM);

    expect(cleared.slots[0].direction).toBe("");
  });

  it("clears a pattern while preserving subdivision", () => {
    const sixteenthPattern = setStrummingSlotDirection(createEmptyStrummingPatternData(SIXTEENTH_STRUMMING_SUBDIVISION), 0, DOWN_STRUM);

    const cleared = clearStrummingPattern(sixteenthPattern);

    expect(cleared.subdivision).toBe(SIXTEENTH_STRUMMING_SUBDIVISION);
    expect(cleared.slots).toHaveLength(16);
    expect(cleared.slots.every((slot) => slot.direction === "")).toBe(true);
  });

  it("detects whether a pattern has at least one strum", () => {
    expect(hasStrummingPattern()).toBe(false);
    expect(hasStrummingPattern(createEmptyStrummingPatternData())).toBe(false);

    const pattern = setStrummingSlotDirection(undefined, 0, DOWN_STRUM);

    expect(hasStrummingPattern(pattern)).toBe(true);
  });

  it("serializes and compacts strumming patterns", () => {
    const pattern = normalizeStrummingPatternData([DOWN_STRUM, "", DOWN_STRUM, UP_STRUM]);

    expect(serializeStrummingPattern(pattern)).toBe(`${DOWN_STRUM} ${REST_STRUM} ${DOWN_STRUM} ${UP_STRUM} ${REST_STRUM} ${REST_STRUM} ${REST_STRUM} ${REST_STRUM}`);
    expect(getCompactStrummingPattern(pattern)).toBe(`${DOWN_STRUM} ${DOWN_STRUM} ${UP_STRUM}`);
  });

  it("normalizes subdivision aliases", () => {
    expect(normalizeStrummingSubdivision("16")).toBe(SIXTEENTH_STRUMMING_SUBDIVISION);
    expect(normalizeStrummingSubdivision("16th")).toBe(SIXTEENTH_STRUMMING_SUBDIVISION);
    expect(normalizeStrummingSubdivision("sixteenths")).toBe(SIXTEENTH_STRUMMING_SUBDIVISION);
    expect(normalizeStrummingSubdivision("anything else")).toBe(EIGHTH_STRUMMING_SUBDIVISION);
  });

  it("normalizes direction aliases", () => {
    expect(normalizeStrummingDirection("down")).toBe(DOWN_STRUM);
    expect(normalizeStrummingDirection("d")).toBe(DOWN_STRUM);
    expect(normalizeStrummingDirection("up")).toBe(UP_STRUM);
    expect(normalizeStrummingDirection("u")).toBe(UP_STRUM);
    expect(normalizeStrummingDirection("rest")).toBe("");
  });

  it("returns pattern subdivision, slot count, slots per beat, and slot duration", () => {
    const eighthPattern = normalizeStrummingPatternData([DOWN_STRUM]);
    const sixteenthPattern = createEmptyStrummingPatternData(SIXTEENTH_STRUMMING_SUBDIVISION);

    expect(getStrummingPatternSubdivision(eighthPattern)).toBe(EIGHTH_STRUMMING_SUBDIVISION);
    expect(getStrummingPatternSlotCount(eighthPattern)).toBe(8);
    expect(getStrummingSlotsPerBeat(eighthPattern)).toBe(2);
    expect(getStrummingSlotDurationMs(120, eighthPattern)).toBe(250);

    expect(getStrummingPatternSubdivision(sixteenthPattern)).toBe(SIXTEENTH_STRUMMING_SUBDIVISION);
    expect(getStrummingPatternSlotCount(sixteenthPattern)).toBe(16);
    expect(getStrummingSlotsPerBeat(sixteenthPattern)).toBe(4);
    expect(getStrummingSlotDurationMs(120, sixteenthPattern)).toBe(125);
  });

  it("creates valid normalized patterns from every preset", () => {
    STRUMMING_PRESETS.forEach((preset) => {
      const pattern = createPresetStrummingPattern(preset);
      const normalizedSlots = normalizeStrummingPattern(pattern);

      expect(pattern.subdivision).toBe(normalizeStrummingSubdivision(preset.subdivision));
      expect(normalizedSlots).toHaveLength(preset.subdivision === SIXTEENTH_STRUMMING_SUBDIVISION ? 16 : 8);
      expect(hasStrummingPattern(pattern)).toBe(true);
    });
  });
});
