import { describe, expect, it } from "vitest";
import {
  formatReferenceDuration,
  getDurationDetectionSupport,
  getReferenceDurationSeconds,
  getReferenceDurationSourceLabel,
  parseReferenceDurationInput,
} from "../referenceDurationUtils";

describe("referenceDurationUtils", () => {
  it("parses manual reference duration input", () => {
    expect(parseReferenceDurationInput("4:34")).toBe(274);
    expect(parseReferenceDurationInput("274")).toBe(274);
    expect(parseReferenceDurationInput("1:02:03")).toBe(3723);
    expect(parseReferenceDurationInput("0")).toBeNull();
    expect(parseReferenceDurationInput("bad")).toBeNull();
  });

  it("formats reference duration", () => {
    expect(formatReferenceDuration(274)).toBe("4:34");
    expect(formatReferenceDuration(3723)).toBe("1:02:03");
    expect(formatReferenceDuration("4:34")).toBe("4:34");
  });

  it("detects supported duration sources", () => {
    expect(
      getDurationDetectionSupport({
        isValid: true,
        mediaId: "abc123",
        platform: "youtube",
        url: "https://www.youtube.com/watch?v=abc123",
      }),
    ).toBe("youtube");

    expect(
      getDurationDetectionSupport({
        isValid: true,
        platform: "vimeo",
        url: "https://vimeo.com/123456",
      }),
    ).toBe("vimeo");

    expect(
      getDurationDetectionSupport({
        isValid: true,
        platform: "spotify",
        url: "https://open.spotify.com/track/123",
      }),
    ).toBe("unsupported");
  });

  it("resolves source labels", () => {
    expect(
      getReferenceDurationSourceLabel({
        platformLabel: "YouTube",
      }),
    ).toBe("YouTube");

    expect(getReferenceDurationSourceLabel({ platform: "vimeo" })).toBe("Vimeo");
    expect(getReferenceDurationSourceLabel({})).toBe("reference");
  });

  it("normalizes numeric duration values", () => {
    expect(getReferenceDurationSeconds(274.4)).toBe(274);
    expect(getReferenceDurationSeconds("4:34")).toBe(274);
  });
});
