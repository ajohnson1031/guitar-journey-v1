import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DOWN_STRUM, UP_STRUM } from "../../constants";
import { EIGHTH_STRUMMING_SUBDIVISION, SIXTEENTH_STRUMMING_SUBDIVISION, createEmptyStrummingPatternData, setStrummingSlotDirection } from "../../utils/strummingUtils";
import useStrummingPlayback, { getStrummingDirectionClass, getStrummingDirectionLabel } from "../useStrummingPlayback";

function createEighthPattern() {
  let pattern = createEmptyStrummingPatternData(EIGHTH_STRUMMING_SUBDIVISION);

  pattern = setStrummingSlotDirection(pattern, 0, DOWN_STRUM);
  pattern = setStrummingSlotDirection(pattern, 1, UP_STRUM);

  return pattern;
}

function createSixteenthPattern() {
  let pattern = createEmptyStrummingPatternData(SIXTEENTH_STRUMMING_SUBDIVISION);

  pattern = setStrummingSlotDirection(pattern, 0, DOWN_STRUM);
  pattern = setStrummingSlotDirection(pattern, 2, UP_STRUM);
  pattern = setStrummingSlotDirection(pattern, 8, DOWN_STRUM);

  return pattern;
}

describe("useStrummingPlayback", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts at slot 0 when idle", () => {
    const pattern = createEighthPattern();

    const { result } = renderHook(() =>
      useStrummingPlayback({
        bpm: 120,
        isRunning: false,
        pattern,
      }),
    );

    expect(result.current.activeSlot).toBe(0);
    expect(result.current.activeSlotData.direction).toBe(DOWN_STRUM);
    expect(result.current.directionLabel).toBe("Down");
    expect(result.current.directionClass).toBe("is-down");
    expect(result.current.subdivision).toBe(EIGHTH_STRUMMING_SUBDIVISION);
    expect(result.current.slots).toHaveLength(8);
  });

  it("advances through eighth-note slots based on BPM", () => {
    vi.useFakeTimers();

    const pattern = createEighthPattern();

    const { result } = renderHook(() =>
      useStrummingPlayback({
        bpm: 120,
        isRunning: true,
        pattern,
      }),
    );

    expect(result.current.activeSlot).toBe(0);

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(result.current.activeSlot).toBe(1);
    expect(result.current.activeSlotData.direction).toBe(UP_STRUM);

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(result.current.activeSlot).toBe(2);
  });

  it("wraps back to slot 0 after the final eighth-note slot", () => {
    vi.useFakeTimers();

    const pattern = createEighthPattern();

    const { result } = renderHook(() =>
      useStrummingPlayback({
        bpm: 120,
        isRunning: true,
        pattern,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(250 * 8);
    });

    expect(result.current.activeSlot).toBe(0);
  });

  it("advances through sixteenth-note slots based on subdivision", () => {
    vi.useFakeTimers();

    const pattern = createSixteenthPattern();

    const { result } = renderHook(() =>
      useStrummingPlayback({
        bpm: 120,
        isRunning: true,
        pattern,
      }),
    );

    expect(result.current.subdivision).toBe(SIXTEENTH_STRUMMING_SUBDIVISION);
    expect(result.current.slots).toHaveLength(16);
    expect(result.current.activeSlot).toBe(0);

    act(() => {
      vi.advanceTimersByTime(125);
    });

    expect(result.current.activeSlot).toBe(1);

    act(() => {
      vi.advanceTimersByTime(125);
    });

    expect(result.current.activeSlot).toBe(2);
    expect(result.current.activeSlotData.direction).toBe(UP_STRUM);
  });

  it("wraps back to slot 0 after the final sixteenth-note slot", () => {
    vi.useFakeTimers();

    const pattern = createSixteenthPattern();

    const { result } = renderHook(() =>
      useStrummingPlayback({
        bpm: 120,
        isRunning: true,
        pattern,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(125 * 16);
    });

    expect(result.current.activeSlot).toBe(0);
  });

  it("resets active slot to 0 when playback stops", () => {
    vi.useFakeTimers();

    const pattern = createEighthPattern();

    const { result, rerender } = renderHook(
      ({ isRunning }) =>
        useStrummingPlayback({
          bpm: 120,
          isRunning,
          pattern,
        }),
      {
        initialProps: {
          isRunning: true,
        },
      },
    );

    act(() => {
      vi.advanceTimersByTime(250 * 3);
    });

    expect(result.current.activeSlot).toBe(3);

    rerender({
      isRunning: false,
    });

    expect(result.current.activeSlot).toBe(0);
  });

  it("resets active slot to 0 when subdivision changes", () => {
    vi.useFakeTimers();

    const eighthPattern = createEighthPattern();
    const sixteenthPattern = createSixteenthPattern();

    const { result, rerender } = renderHook(
      ({ pattern }) =>
        useStrummingPlayback({
          bpm: 120,
          isRunning: true,
          pattern,
        }),
      {
        initialProps: {
          pattern: eighthPattern,
        },
      },
    );

    act(() => {
      vi.advanceTimersByTime(250 * 3);
    });

    expect(result.current.activeSlot).toBe(3);

    rerender({
      pattern: sixteenthPattern,
    });

    expect(result.current.activeSlot).toBe(0);
    expect(result.current.subdivision).toBe(SIXTEENTH_STRUMMING_SUBDIVISION);
  });

  it("returns direction labels and classes", () => {
    expect(getStrummingDirectionLabel(DOWN_STRUM)).toBe("Down");
    expect(getStrummingDirectionLabel(UP_STRUM)).toBe("Up");
    expect(getStrummingDirectionLabel("")).toBe("Rest");

    expect(getStrummingDirectionClass(DOWN_STRUM)).toBe("is-down");
    expect(getStrummingDirectionClass(UP_STRUM)).toBe("is-up");
    expect(getStrummingDirectionClass("")).toBe("is-rest");
  });
});
