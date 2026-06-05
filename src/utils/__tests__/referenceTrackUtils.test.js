import { describe, expect, it } from "vitest";
import { getReferenceTrackSummary, parseReferenceTrackUrl } from "../referenceTrackUtils";

describe("referenceTrackUtils", () => {
  it("parses standard YouTube URLs", () => {
    const reference = parseReferenceTrackUrl("https://www.youtube.com/watch?v=abc123XYZ");

    expect(reference.isValid).toBe(true);
    expect(reference.platform).toBe("youtube");
    expect(reference.mediaId).toBe("abc123XYZ");
    expect(reference.embedUrl).toBe("https://www.youtube.com/embed/abc123XYZ");
  });

  it("parses youtu.be URLs", () => {
    const reference = parseReferenceTrackUrl("https://youtu.be/abc123XYZ");

    expect(reference.isValid).toBe(true);
    expect(reference.platformLabel).toBe("YouTube");
    expect(reference.mediaId).toBe("abc123XYZ");
  });

  it("parses Vimeo URLs", () => {
    const reference = parseReferenceTrackUrl("https://vimeo.com/123456789");

    expect(reference.isValid).toBe(true);
    expect(reference.platform).toBe("vimeo");
    expect(reference.mediaId).toBe("123456789");
    expect(reference.embedUrl).toBe("https://player.vimeo.com/video/123456789");
  });

  it("parses Spotify track URLs", () => {
    const reference = parseReferenceTrackUrl("https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC");

    expect(reference.isValid).toBe(true);
    expect(reference.platform).toBe("spotify");
    expect(reference.kind).toBe("track");
    expect(reference.embedUrl).toBe("https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC");
  });

  it("treats ordinary valid URLs as generic references", () => {
    const reference = parseReferenceTrackUrl("example.com/reference");

    expect(reference.isValid).toBe(true);
    expect(reference.platform).toBe("generic");
    expect(reference.url).toBe("https://example.com/reference");
    expect(getReferenceTrackSummary(reference)).toBe("Reference link saved.");
  });

  it("returns a warning for malformed URLs", () => {
    const reference = parseReferenceTrackUrl("not a url");

    expect(reference.isValid).toBe(false);
    expect(reference.error).toBe("Enter a valid reference URL.");
  });
});
