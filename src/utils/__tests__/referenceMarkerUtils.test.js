import { describe, expect, it } from "vitest";
import {
  buildReferenceTimestampUrl,
  formatReferenceMarkerTime,
  getReferenceMarkerForSection,
  parseReferenceMarkers,
  parseTimestampToSeconds,
  referenceMarkersToText,
} from "../referenceMarkerUtils";

describe("referenceMarkerUtils", () => {
  it("parses marker lines without splitting the timestamp colon into the label", () => {
    const markers = parseReferenceMarkers(`
      Intro: 0:00
      Verse - 0:12
      Bridge - 1:32
      Chorus - 0:48
    `);

    expect(markers).toEqual([
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
      {
        id: "bridge-92",
        label: "Bridge",
        seconds: 92,
        time: "1:32",
      },
    ]);
  });

  it("matches clean marker labels to song section names", () => {
    const markers = parseReferenceMarkers(`
      Verse - 0:12
      Chorus - 0:48
    `);

    expect(getReferenceMarkerForSection(markers, "Verse")).toMatchObject({
      label: "Verse",
      seconds: 12,
    });
    expect(getReferenceMarkerForSection(markers, "Chorus")).toMatchObject({
      label: "Chorus",
      seconds: 48,
    });
  });

  it("supports hyphenated section labels", () => {
    const markers = parseReferenceMarkers(`
      Pre-Chorus - 0:36
      Post Chorus: 1:08
    `);

    expect(markers[0]).toMatchObject({
      label: "Pre-Chorus",
      seconds: 36,
    });
    expect(markers[1]).toMatchObject({
      label: "Post Chorus",
      seconds: 68,
    });
  });

  it("parses timestamps", () => {
    expect(parseTimestampToSeconds("0:12")).toBe(12);
    expect(parseTimestampToSeconds("1:32")).toBe(92);
    expect(parseTimestampToSeconds("1:02:03")).toBe(3723);
    expect(parseTimestampToSeconds("48")).toBe(48);
    expect(parseTimestampToSeconds("nope")).toBeNull();
  });

  it("formats timestamps", () => {
    expect(formatReferenceMarkerTime(12)).toBe("0:12");
    expect(formatReferenceMarkerTime(92)).toBe("1:32");
    expect(formatReferenceMarkerTime(3723)).toBe("1:02:03");
  });

  it("serializes markers back to clean text", () => {
    const markers = parseReferenceMarkers(`
      Intro: 0:00
      Verse - 0:12
      Chorus - 0:48
    `);

    expect(referenceMarkersToText(markers)).toBe("Intro: 0:00\nVerse: 0:12\nChorus: 0:48");
  });

  it("builds reference timestamp links", () => {
    const youtubeUrl = buildReferenceTimestampUrl(
      {
        platform: "youtube",
        url: "https://www.youtube.com/watch?v=abc123",
      },
      92,
    );

    expect(youtubeUrl).toBe("https://www.youtube.com/watch?v=abc123&t=92s");

    const vimeoUrl = buildReferenceTimestampUrl(
      {
        platform: "vimeo",
        url: "https://vimeo.com/123456",
      },
      92,
    );

    expect(vimeoUrl).toBe("https://vimeo.com/123456#t=1m32s");
  });
});
