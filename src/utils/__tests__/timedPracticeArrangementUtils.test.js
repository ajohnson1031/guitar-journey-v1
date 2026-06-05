import { describe, expect, it } from "vitest";
import { createTimedPracticeArrangement, getArrangementCompletionLabel } from "../timedPracticeArrangementUtils";

const SONG = {
  referenceTrack: {
    platform: "youtube",
    url: "https://www.youtube.com/watch?v=abc123",
  },
  referenceMarkers: [
    { label: "Intro", seconds: 0 },
    { label: "Verse", seconds: 12 },
    { label: "Chorus", seconds: 48 },
    { label: "Bridge", seconds: 92 },
  ],
  sections: [
    { name: "Verse", progression: "G - D - Em - C" },
    { name: "Chorus", progression: "C - G - D - Em" },
    { name: "Outro", progression: "G - C - G" },
  ],
};

describe("timedPracticeArrangementUtils", () => {
  it("maps song sections to matching reference markers", () => {
    const arrangement = createTimedPracticeArrangement(SONG);

    expect(arrangement.totalSections).toBe(3);
    expect(arrangement.timedSectionsCount).toBe(2);
    expect(arrangement.missingSectionsCount).toBe(1);
    expect(arrangement.sections[0].name).toBe("Verse");
    expect(arrangement.sections[0].startTime).toBe("0:12");
    expect(arrangement.sections[0].durationText).toBe("0:36");
    expect(arrangement.sections[0].referenceUrl).toContain("t=12s");
  });

  it("returns unassigned markers separately", () => {
    const arrangement = createTimedPracticeArrangement(SONG);
    const markerLabels = arrangement.unassignedMarkers.map((marker) => marker.label);

    expect(markerLabels).toEqual(["Intro", "Bridge"]);
  });

  it("formats completion labels", () => {
    const arrangement = createTimedPracticeArrangement(SONG);

    expect(getArrangementCompletionLabel(arrangement)).toBe("2/3 timed");
  });

  it("handles songs without reference markers", () => {
    const arrangement = createTimedPracticeArrangement({
      sections: [{ name: "Verse", progression: "A - E" }],
    });

    expect(arrangement.hasReference).toBe(false);
    expect(arrangement.hasMarkers).toBe(false);
    expect(arrangement.timedSectionsCount).toBe(0);
    expect(arrangement.sections[0].isTimed).toBe(false);
  });
});
