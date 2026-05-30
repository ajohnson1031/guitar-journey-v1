import { DOWN_STRUM, UP_STRUM } from "../constants";

export const DEFAULT_STRUMMING_SUBDIVISION = "eighth";
export const EIGHTH_STRUMMING_SUBDIVISION = "eighth";
export const SIXTEENTH_STRUMMING_SUBDIVISION = "sixteenth";

export const STRUMMING_SUBDIVISIONS = {
  [EIGHTH_STRUMMING_SUBDIVISION]: {
    id: EIGHTH_STRUMMING_SUBDIVISION,
    label: "8th Notes",
    shortLabel: "8th",
    description: "Eight slots: 1 & 2 & 3 & 4 &.",
    slotsPerBeat: 2,
    beats: ["1", "&", "2", "&", "3", "&", "4", "&"],
  },
  [SIXTEENTH_STRUMMING_SUBDIVISION]: {
    id: SIXTEENTH_STRUMMING_SUBDIVISION,
    label: "16th Notes",
    shortLabel: "16th",
    description: "Sixteen slots: 1 e & a 2 e & a 3 e & a 4 e & a.",
    slotsPerBeat: 4,
    beats: ["1", "e", "&", "a", "2", "e", "&", "a", "3", "e", "&", "a", "4", "e", "&", "a"],
  },
};

export const STRUMMING_SUBDIVISION_OPTIONS = [
  STRUMMING_SUBDIVISIONS[EIGHTH_STRUMMING_SUBDIVISION],
  STRUMMING_SUBDIVISIONS[SIXTEENTH_STRUMMING_SUBDIVISION],
];

export const STRUMMING_BEATS = STRUMMING_SUBDIVISIONS[EIGHTH_STRUMMING_SUBDIVISION].beats;
export const REST_STRUM = "·";

export const STRUMMING_PRESETS = [
  {
    id: "beginner-downstrums",
    name: "Beginner Downstrums",
    description: "Simple steady quarter-note downstrums.",
    subdivision: EIGHTH_STRUMMING_SUBDIVISION,
    pattern: [DOWN_STRUM, "", DOWN_STRUM, "", DOWN_STRUM, "", DOWN_STRUM, ""],
  },
  {
    id: "classic-folk",
    name: "Classic Folk",
    description: "Common down/down-up/up-down-up feel.",
    subdivision: EIGHTH_STRUMMING_SUBDIVISION,
    pattern: [DOWN_STRUM, "", DOWN_STRUM, UP_STRUM, UP_STRUM, DOWN_STRUM, DOWN_STRUM, UP_STRUM],
  },
  {
    id: "worship-build",
    name: "Worship Build",
    description: "Steady, spacious pattern for open chord songs.",
    subdivision: EIGHTH_STRUMMING_SUBDIVISION,
    pattern: [DOWN_STRUM, "", DOWN_STRUM, "", DOWN_STRUM, UP_STRUM, DOWN_STRUM, UP_STRUM],
  },
  {
    id: "pop-island",
    name: "Pop / Island",
    description: "Light syncopated pop feel.",
    subdivision: EIGHTH_STRUMMING_SUBDIVISION,
    pattern: [DOWN_STRUM, "", DOWN_STRUM, UP_STRUM, "", UP_STRUM, DOWN_STRUM, UP_STRUM],
  },
  {
    id: "sixteenth-pop-push",
    name: "16th Pop Push",
    description: "A simple sixteenth-note push with rests between strokes.",
    subdivision: SIXTEENTH_STRUMMING_SUBDIVISION,
    pattern: [DOWN_STRUM, "", "", "", "", "", DOWN_STRUM, UP_STRUM, "", UP_STRUM, "", "", DOWN_STRUM, "", UP_STRUM, ""],
  },
];

function getSubdivisionConfig(subdivision) {
  return STRUMMING_SUBDIVISIONS[normalizeStrummingSubdivision(subdivision)];
}

function inferSubdivisionFromArray(value) {
  return value.length > STRUMMING_BEATS.length ? SIXTEENTH_STRUMMING_SUBDIVISION : EIGHTH_STRUMMING_SUBDIVISION;
}

export function normalizeStrummingSubdivision(value) {
  const subdivision = String(value || "").trim().toLowerCase();

  if (subdivision === SIXTEENTH_STRUMMING_SUBDIVISION || subdivision === "16" || subdivision === "16th" || subdivision === "sixteenths") {
    return SIXTEENTH_STRUMMING_SUBDIVISION;
  }

  return EIGHTH_STRUMMING_SUBDIVISION;
}

export function createEmptyStrummingSlots(subdivision = DEFAULT_STRUMMING_SUBDIVISION) {
  const config = getSubdivisionConfig(subdivision);

  return config.beats.map((beat, slot) => ({
    slot,
    beat,
    direction: "",
  }));
}

export function createEmptyStrummingPattern(subdivision = DEFAULT_STRUMMING_SUBDIVISION) {
  return createEmptyStrummingSlots(subdivision);
}

export function createEmptyStrummingPatternData(subdivision = DEFAULT_STRUMMING_SUBDIVISION) {
  const normalizedSubdivision = normalizeStrummingSubdivision(subdivision);

  return {
    subdivision: normalizedSubdivision,
    slots: createEmptyStrummingSlots(normalizedSubdivision),
  };
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

function normalizePatternObject(value, slot, subdivision) {
  const config = getSubdivisionConfig(subdivision);

  return {
    slot,
    beat: config.beats[slot],
    direction: normalizeStrummingDirection(value?.direction || value?.strum || ""),
  };
}

function normalizePatternToken(value, slot, subdivision) {
  const config = getSubdivisionConfig(subdivision);

  return {
    slot,
    beat: config.beats[slot],
    direction: normalizeStrummingDirection(value),
  };
}

function getRawPatternSlots(value) {
  if (Array.isArray(value)) return value;

  if (Array.isArray(value?.slots)) return value.slots;

  if (Array.isArray(value?.pattern)) return value.pattern;

  return null;
}

function getRawPatternSubdivision(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return normalizeStrummingSubdivision(value.subdivision);
  }

  if (Array.isArray(value)) {
    return inferSubdivisionFromArray(value);
  }

  return DEFAULT_STRUMMING_SUBDIVISION;
}

function normalizeStrummingSlots(value, subdivision) {
  const normalizedSubdivision = normalizeStrummingSubdivision(subdivision);
  const emptyPattern = createEmptyStrummingSlots(normalizedSubdivision);
  const rawSlots = getRawPatternSlots(value);

  if (!value) return emptyPattern;

  if (rawSlots) {
    if (rawSlots.some((item) => item && typeof item === "object")) {
      return emptyPattern.map((slot) => {
        const matchingSlot = rawSlots.find((item) => Number(item?.slot) === slot.slot);
        const fallbackSlot = rawSlots[slot.slot];

        return normalizePatternObject(matchingSlot || fallbackSlot, slot.slot, normalizedSubdivision);
      });
    }

    return emptyPattern.map((slot) => normalizePatternToken(rawSlots[slot.slot], slot.slot, normalizedSubdivision));
  }

  const tokens = String(value)
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  return emptyPattern.map((slot) => {
    const token = tokens[slot.slot];

    if (token === REST_STRUM || token === "-" || token === "_") {
      return normalizePatternToken("", slot.slot, normalizedSubdivision);
    }

    return normalizePatternToken(token, slot.slot, normalizedSubdivision);
  });
}

export function normalizeStrummingPatternData(value) {
  const subdivision = getRawPatternSubdivision(value);

  return {
    subdivision,
    slots: normalizeStrummingSlots(value, subdivision),
  };
}

export function normalizeStrummingPattern(value) {
  return normalizeStrummingPatternData(value).slots;
}

export function getStrummingPatternSubdivision(value) {
  return normalizeStrummingPatternData(value).subdivision;
}

export function getStrummingPatternSlotCount(value) {
  return normalizeStrummingPatternData(value).slots.length;
}

export function getStrummingSlotsPerBeat(value) {
  const { subdivision } = normalizeStrummingPatternData(value);

  return getSubdivisionConfig(subdivision).slotsPerBeat;
}

export function getStrummingSlotDurationMs(bpm, pattern) {
  const safeBpm = Number(bpm);
  const slotsPerBeat = getStrummingSlotsPerBeat(pattern);
  const quarterNoteMs = 60000 / (Number.isFinite(safeBpm) && safeBpm > 0 ? safeBpm : 72);

  return quarterNoteMs / slotsPerBeat;
}

function remapDirectionsForSubdivision(pattern, nextSubdivision) {
  const currentPattern = normalizeStrummingPatternData(pattern);
  const normalizedNextSubdivision = normalizeStrummingSubdivision(nextSubdivision);
  const nextSlots = createEmptyStrummingSlots(normalizedNextSubdivision);

  if (currentPattern.subdivision === normalizedNextSubdivision) {
    return currentPattern.slots;
  }

  if (currentPattern.subdivision === EIGHTH_STRUMMING_SUBDIVISION && normalizedNextSubdivision === SIXTEENTH_STRUMMING_SUBDIVISION) {
    return nextSlots.map((slot) => {
      const matchingEighthSlot = currentPattern.slots[slot.slot / 2];

      if (slot.slot % 2 !== 0 || !matchingEighthSlot) return slot;

      return {
        ...slot,
        direction: matchingEighthSlot.direction,
      };
    });
  }

  if (currentPattern.subdivision === SIXTEENTH_STRUMMING_SUBDIVISION && normalizedNextSubdivision === EIGHTH_STRUMMING_SUBDIVISION) {
    return nextSlots.map((slot) => {
      const matchingSixteenthSlot = currentPattern.slots[slot.slot * 2];

      return {
        ...slot,
        direction: matchingSixteenthSlot?.direction || "",
      };
    });
  }

  return nextSlots;
}

export function setStrummingSubdivision(pattern, subdivision) {
  const normalizedSubdivision = normalizeStrummingSubdivision(subdivision);

  return {
    subdivision: normalizedSubdivision,
    slots: remapDirectionsForSubdivision(pattern, normalizedSubdivision),
  };
}

export function setStrummingSlotDirection(pattern, slot, direction) {
  const normalizedPattern = normalizeStrummingPatternData(pattern);
  const nextDirection = normalizeStrummingDirection(direction);

  return {
    ...normalizedPattern,
    slots: normalizedPattern.slots.map((item) => {
      if (item.slot !== slot) return item;

      return {
        ...item,
        direction: item.direction === nextDirection ? "" : nextDirection,
      };
    }),
  };
}

export function clearStrummingPattern(pattern) {
  const subdivision = getStrummingPatternSubdivision(pattern);

  return createEmptyStrummingPatternData(subdivision);
}

export function createPresetStrummingPattern(preset) {
  const subdivision = normalizeStrummingSubdivision(preset?.subdivision);

  return {
    subdivision,
    slots: normalizeStrummingSlots(preset?.pattern, subdivision),
  };
}

export function hasStrummingPattern(pattern) {
  return normalizeStrummingPatternData(pattern).slots.some((slot) => slot.direction);
}

export function serializeStrummingPattern(pattern) {
  return normalizeStrummingPatternData(pattern)
    .slots.map((slot) => slot.direction || REST_STRUM)
    .join(" ");
}

export function getCompactStrummingPattern(pattern) {
  return normalizeStrummingPatternData(pattern)
    .slots.filter((slot) => slot.direction)
    .map((slot) => slot.direction)
    .join(" ");
}
