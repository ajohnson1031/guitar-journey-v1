import { describe, expect, it } from "vitest";
import {
  extractReferenceMarkersFromText,
  getReferenceTimestampExtractionSummary,
  parseTimestampTextLine,
  referenceTimestampMarkersToText,
} from "../referenceTimestampExtractionUtils";

describe("referenceTimestampExtractionUtils", () => {
  it("parses leading timestamp lines", () => {
    expect(parseTimestampTextLine("0:12 Verse")).toMatchObject({ label: "Verse", seconds: 12, time: "0:12" });
    expect(parseTimestampTextLine("[1:32] Bridge")).toMatchObject({ label: "Bridge", seconds: 92, time: "1:32" });
  });

  it("parses trailing timestamp lines", () => {
    expect(parseTimestampTextLine("Chorus - 0:48")).toMatchObject({ label: "Chorus", seconds: 48, time: "0:48" });
    expect(parseTimestampTextLine("Intro: 0:00")).toMatchObject({ label: "Intro", seconds: 0, time: "0:00" });
  });

  it("extracts and sorts markers from chapter text", () => {
    const markers = extractReferenceMarkersFromText(`
      0:48 Chorus
      0:00 Intro
      0:12 Verse
      1:32 Bridge
    `);

    expect(markers.map((marker) => marker.label)).toEqual(["Intro", "Verse", "Chorus", "Bridge"]);
    expect(markers.map((marker) => marker.seconds)).toEqual([0, 12, 48, 92]);
  });

  it("serializes extracted markers to editable marker text", () => {
    const markers = extractReferenceMarkersFromText(`
      0:00 Intro
      0:12 Verse
    `);

    expect(referenceTimestampMarkersToText(markers)).toBe("Intro: 0:00\nVerse: 0:12");
  });

  it("summarizes extraction", () => {
    expect(getReferenceTimestampExtractionSummary([])).toBe("No timestamp markers were detected.");
    expect(getReferenceTimestampExtractionSummary([{ label: "Intro" }])).toBe("Detected 1 possible section marker. Review before applying.");
    expect(getReferenceTimestampExtractionSummary([{ label: "Intro" }, { label: "Verse" }])).toBe("Detected 2 possible section markers. Review before applying.");
  });
});
