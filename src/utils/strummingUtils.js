import { DOWN_STRUM, UP_STRUM } from "../constants";

export const STRUMMING_BEATS = ["1", "&", "2", "&", "3", "&", "4", "&"];
export const REST_STRUM = "·";

export function createEmptyStrummingPattern() {
  return STRUMMING_BEATS.map((beat, slot) => ({
    slot,
    beat,
    direction: "",
  }));
}

export function normalizeStrummingDirection(value) {
  const direction = String(value || "")
    .trim()
    .toLowerCase();

  if (direction === DOWN_STRUM || direction === "down" || direction === "d") {
    return DOWN_STRUM;
  }

  if (direction === UP_STRUM || direction === "up" || direction === "u") {
    return UP_STRUM;
  }

  return "";
}

function normalizePatternObject(value, slot) {
  return {
    slot,
    beat: STRUMMING_BEATS[slot],
    direction: normalizeStrummingDirection(value?.direction || value?.strum || ""),
  };
}

function normalizePatternToken(value, slot) {
  return {
    slot,
    beat: STRUMMING_BEATS[slot],
    direction: normalizeStrummingDirection(value),
  };
}

export function normalizeStrummingPattern(value) {
  const emptyPattern = createEmptyStrummingPattern();

  if (!value) return emptyPattern;

  if (Array.isArray(value)) {
    if (value.some((item) => item && typeof item === "object")) {
      return emptyPattern.map((slot) => {
        const matchingSlot = value.find((item) => Number(item?.slot) === slot.slot);
        const fallbackSlot = value[slot.slot];

        return normalizePatternObject(matchingSlot || fallbackSlot, slot.slot);
      });
    }

    return emptyPattern.map((slot) => normalizePatternToken(value[slot.slot], slot.slot));
  }

  const tokens = String(value)
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  return emptyPattern.map((slot) => {
    const token = tokens[slot.slot];

    if (token === REST_STRUM || token === "-" || token === "_") {
      return normalizePatternToken("", slot.slot);
    }

    return normalizePatternToken(token, slot.slot);
  });
}

export function setStrummingSlotDirection(pattern, slot, direction) {
  const normalizedPattern = normalizeStrummingPattern(pattern);
  const nextDirection = normalizeStrummingDirection(direction);

  return normalizedPattern.map((item) => {
    if (item.slot !== slot) return item;

    return {
      ...item,
      direction: item.direction === nextDirection ? "" : nextDirection,
    };
  });
}

export function clearStrummingPattern() {
  return createEmptyStrummingPattern();
}

export function hasStrummingPattern(pattern) {
  return normalizeStrummingPattern(pattern).some((slot) => slot.direction);
}

export function serializeStrummingPattern(pattern) {
  return normalizeStrummingPattern(pattern)
    .map((slot) => slot.direction || REST_STRUM)
    .join(" ");
}

export function getCompactStrummingPattern(pattern) {
  return normalizeStrummingPattern(pattern)
    .filter((slot) => slot.direction)
    .map((slot) => slot.direction)
    .join(" ");
}
