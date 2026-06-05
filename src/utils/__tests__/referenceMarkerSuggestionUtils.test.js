import { describe, expect, it } from "vitest";
import {
  createSuggestedReferenceMarkers,
  estimateSectionDurationSeconds,
  getReferenceDurationSeconds,
  getSectionStartTimes,
  getSuggestedReferenceMarkerSummary,
  mergeReferenceMarkerDraft,
  parseReferenceDurationInput,
  suggestedReferenceMarkersToText,
} from "../referenceMarkerSuggestionUtils";

const SECTIONS = [
  { name: "Intro", progression: "E - Bm - A" },
  { name: "Verse", progression: "E - Bm - A" },
  { name: "Pre Chorus", progression: "E - Bm - A" },
  { name: "Chorus", progression: "E - Bm - A" },
  { name: "Interlude", progression: "E - Bm - A" },
  { name: "Outro", progression: "E - Bm - A" },
];

describe("referenceMarkerSuggestionUtils", () => {
  it("creates a marker draft from song sections and BPM", () => {
    const markers = createSuggestedReferenceMarkers({
      bpm: 80,
      sections: SECTIONS.slice(0, 3),
    });

    expect(markers).toHaveLength(3);
    expect(markers[0]).toMatchObject({
      label: "Intro",
      seconds: 0,
      time: "0:00",
      isSuggested: true,
    });
    expect(markers[1].label).toBe("Verse");
    expect(markers[1].seconds).toBeGreaterThan(0);
    expect(markers[2].label).toBe("Pre Chorus");
    expect(markers[2].seconds).toBeGreaterThan(markers[1].seconds);
  });

  it("scales marker starts across the supplied reference duration", () => {
    const markers = createSuggestedReferenceMarkers({
      bpm: 40,
      referenceDurationSeconds: 274,
      sections: SECTIONS,
    });

    expect(markers[0]).toMatchObject({
      label: "Intro",
      seconds: 0,
      time: "0:00",
    });

    expect(markers.at(-1).label).toBe("Outro");
    expect(markers.at(-1).seconds).toBeGreaterThan(200);
    expect(markers.at(-1).seconds).toBeLessThan(274);
  });

  it("returns section start times that use most of the reference duration", () => {
    const starts = getSectionStartTimes(SECTIONS, 40, 274);

    expect(starts[0]).toBe(0);
    expect(starts.at(-1)).toBeGreaterThan(200);
  });

  it("parses reference duration inputs", () => {
    expect(parseReferenceDurationInput("4:34")).toBe(274);
    expect(parseReferenceDurationInput("274")).toBe(274);
    expect(parseReferenceDurationInput("1:02:03")).toBe(3723);
    expect(parseReferenceDurationInput("bad")).toBeNull();
    expect(getReferenceDurationSeconds(274)).toBe(274);
  });

  it("serializes marker drafts to editable text", () => {
    const text = suggestedReferenceMarkersToText({
      bpm: 80,
      sections: SECTIONS.slice(0, 2),
    });

    expect(text).toMatch(/^Intro: 0:00\nVerse: 0:\d{2}$/);
  });

  it("keeps existing marker timestamps when generating missing markers", () => {
    const text = mergeReferenceMarkerDraft({
      currentText: "Chorus: 0:48",
      draftText: "Verse: 0:00\nChorus: 0:32\nBridge: 1:04",
    });

    expect(text).toContain("Chorus: 0:48");
    expect(text).toContain("Verse: 0:00");
    expect(text).toContain("Bridge: 1:04");
    expect(text).not.toContain("Chorus: 0:32");
  });

  it("estimates longer common sections than intros", () => {
    const introDuration = estimateSectionDurationSeconds({
      name: "Intro",
      progression: "G - D - Em - C",
    }, 80);
    const chorusDuration = estimateSectionDurationSeconds({
      name: "Chorus",
      progression: "G - D - Em - C",
    }, 80);

    expect(chorusDuration).toBeGreaterThan(introDuration);
  });

  it("summarizes draft generation", () => {
    expect(getSuggestedReferenceMarkerSummary({ referenceDurationSeconds: 274, sections: SECTIONS })).toBe(
      "Drafted 6 section markers across 4:34. Review the timestamps against the reference track before saving.",
    );
  });
});
