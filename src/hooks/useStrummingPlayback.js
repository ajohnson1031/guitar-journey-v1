import * as React from "react";
import { DOWN_STRUM, UP_STRUM } from "../constants";
import { getStrummingSlotDurationMs, normalizeStrummingPatternData } from "../utils/strummingUtils";

const { useEffect, useMemo, useState } = React;

function normalizeBpm(value) {
  const bpm = Number(value);

  if (!Number.isFinite(bpm) || bpm <= 0) {
    return 72;
  }

  return bpm;
}

export function getStrummingDirectionLabel(direction) {
  if (direction === DOWN_STRUM) return "Down";
  if (direction === UP_STRUM) return "Up";

  return "Rest";
}

export function getStrummingDirectionClass(direction) {
  if (direction === DOWN_STRUM) return "is-down";
  if (direction === UP_STRUM) return "is-up";

  return "is-rest";
}

export default function useStrummingPlayback({ bpm, isRunning, pattern }) {
  const patternData = useMemo(() => normalizeStrummingPatternData(pattern), [pattern]);
  const slots = patternData.slots;
  const [activeSlot, setActiveSlot] = useState(0);

  useEffect(() => {
    setActiveSlot(0);
  }, [patternData.subdivision, slots.length]);

  useEffect(() => {
    if (!isRunning) {
      setActiveSlot(0);
      return undefined;
    }

    const safeBpm = normalizeBpm(bpm);
    const slotDurationMs = Math.max(45, getStrummingSlotDurationMs(safeBpm, patternData));

    const intervalId = window.setInterval(() => {
      setActiveSlot((currentSlot) => (currentSlot + 1) % slots.length);
    }, slotDurationMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [bpm, isRunning, patternData, slots.length]);

  const activeSlotData = slots[activeSlot] || slots[0];

  return {
    activeSlot,
    activeSlotData,
    directionClass: getStrummingDirectionClass(activeSlotData?.direction),
    directionLabel: getStrummingDirectionLabel(activeSlotData?.direction),
    slots,
    subdivision: patternData.subdivision,
  };
}
