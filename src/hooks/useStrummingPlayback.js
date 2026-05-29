import * as React from "react";
import { DOWN_STRUM, UP_STRUM } from "../constants";
import { normalizeStrummingPattern } from "../utils/strummingUtils";

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
  const slots = useMemo(() => normalizeStrummingPattern(pattern), [pattern]);
  const [activeSlot, setActiveSlot] = useState(0);

  useEffect(() => {
    setActiveSlot(0);
  }, [slots]);

  useEffect(() => {
    if (!isRunning) {
      setActiveSlot(0);
      return undefined;
    }

    const safeBpm = normalizeBpm(bpm);
    const eighthNoteMs = Math.max(90, 60000 / safeBpm / 2);

    const intervalId = window.setInterval(() => {
      setActiveSlot((currentSlot) => (currentSlot + 1) % slots.length);
    }, eighthNoteMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [bpm, isRunning, slots.length]);

  const activeSlotData = slots[activeSlot] || slots[0];

  return {
    activeSlot,
    activeSlotData,
    directionClass: getStrummingDirectionClass(activeSlotData?.direction),
    directionLabel: getStrummingDirectionLabel(activeSlotData?.direction),
    slots,
  };
}
