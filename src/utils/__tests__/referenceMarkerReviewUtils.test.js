import { describe, expect, it } from "vitest";
import {
  getCurrentMarkerMatchKeys,
  getDetectedMarkerPreviewText,
  getDetectedMarkerReviewStats,
  getDetectedMarkerReviewSummary,
  getMarkerMatchKey,
} from "../referenceMarkerReviewUtils";

const MARKERS = [
  {
    id: "intro-0",
    label: "Intro",
    seconds: 0,
    time: "0:00",
  },
  {
    id: "verse-12",
    label: "Verse",
    seconds: 12,
    time: "0:12",
  },
  {
    id: "chorus-48",
    label: "Chorus",
    seconds: 48,
    time: "0:48",
  },
];

describe("referenceMarkerReviewUtils", () => {
  it("creates stable marker keys", () => {
    expect(getMarkerMatchKey(MARKERS[1])).toBe("verse:12");
  });

  it("creates current marker key sets", () => {
    const keys = getCurrentMarkerMatchKeys("Intro: 0:00\nVerse: 0:12");

    expect(keys.has("intro:0")).toBe(true);
    expect(keys.has("verse:12")).toBe(true);
  });

  it("computes review stats", () => {
    expect(
      getDetectedMarkerReviewStats({
        currentMarkerText: "Intro: 0:00",
        markers: MARKERS,
      }),
    ).toEqual({
      appliedCount: 1,
      isFullyApplied: false,
      totalCount: 3,
      unappliedCount: 2,
    });
  });

  it("detects fully applied marker sets", () => {
    expect(
      getDetectedMarkerReviewStats({
        currentMarkerText: "Intro: 0:00\nVerse: 0:12\nChorus: 0:48",
        markers: MARKERS,
      }).isFullyApplied,
    ).toBe(true);
  });

  it("creates preview text and summaries", () => {
    expect(getDetectedMarkerPreviewText(MARKERS)).toBe("Intro 0:00 · Verse 0:12 · Chorus 0:48");

    expect(
      getDetectedMarkerReviewSummary({
        currentMarkerText: "",
        markers: MARKERS,
      }),
    ).toBe("3 detected markers ready to review.");

    expect(
      getDetectedMarkerReviewSummary({
        currentMarkerText: "Intro: 0:00",
        markers: MARKERS,
      }),
    ).toBe("2 new markers ready to apply · 1 already applied.");
  });
});
