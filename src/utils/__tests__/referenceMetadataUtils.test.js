import { describe, expect, it } from "vitest";
import {
  buildOEmbedUrl,
  getReferenceMetadataSupport,
  hasReferenceMetadata,
  normalizeOEmbedMetadata,
  normalizeReferenceMetadata,
} from "../referenceMetadataUtils";

describe("referenceMetadataUtils", () => {
  it("normalizes common metadata shapes", () => {
    expect(
      normalizeReferenceMetadata({
        author_name: "The Channel",
        duration: 274,
        provider_name: "YouTube",
        thumbnail_url: "https://example.com/thumb.jpg",
        title: "Song Title",
      }),
    ).toMatchObject({
      authorName: "The Channel",
      durationSeconds: 274,
      providerName: "YouTube",
      thumbnailUrl: "https://example.com/thumb.jpg",
      title: "Song Title",
    });
  });

  it("keeps description and chapter text", () => {
    const metadata = normalizeReferenceMetadata({
      chapterText: "0:00 Intro\n0:12 Verse",
      descriptionText: "Demo description",
      title: "Song Title",
    });

    expect(metadata.chapterText).toBe("0:00 Intro\n0:12 Verse");
    expect(metadata.descriptionText).toBe("Demo description");
    expect(metadata.extractedMarkers).toHaveLength(2);
  });

  it("extracts timestamp markers from available metadata text", () => {
    const metadata = normalizeReferenceMetadata({
      description: "0:00 Intro\n0:12 Verse\n0:48 Chorus",
      title: "Song Title",
    });

    expect(metadata.extractedMarkers).toHaveLength(3);
    expect(metadata.extractedMarkers[1]).toMatchObject({
      label: "Verse",
      seconds: 12,
    });
  });

  it("detects metadata presence", () => {
    expect(hasReferenceMetadata(null)).toBe(false);
    expect(hasReferenceMetadata({})).toBe(false);
    expect(hasReferenceMetadata({ title: "Song" })).toBe(true);
    expect(hasReferenceMetadata({ durationSeconds: 274 })).toBe(true);
    expect(hasReferenceMetadata({ extractedMarkers: [{ label: "Intro" }] })).toBe(true);
  });

  it("returns oEmbed support by platform", () => {
    expect(getReferenceMetadataSupport({ isValid: true, platform: "youtube", url: "https://youtu.be/abc" })).toBe("youtube");
    expect(getReferenceMetadataSupport({ isValid: true, platform: "vimeo", url: "https://vimeo.com/123" })).toBe("vimeo");
    expect(getReferenceMetadataSupport({ isValid: true, platform: "spotify", url: "https://open.spotify.com/track/123" })).toBe("spotify");
    expect(getReferenceMetadataSupport({ isValid: true, platform: "generic", url: "https://example.com" })).toBe("unsupported");
  });

  it("builds oEmbed URLs", () => {
    const url = buildOEmbedUrl({
      platform: "youtube",
      url: "https://www.youtube.com/watch?v=abc123",
    });

    expect(url).toContain("https://www.youtube.com/oembed");
    expect(url).toContain("format=json");
    expect(url).toContain("url=");
  });

  it("adds fallback source labels to oEmbed metadata", () => {
    expect(
      normalizeOEmbedMetadata(
        {
          title: "Video Title",
        },
        {
          platform: "youtube",
          platformLabel: "YouTube",
        },
      ),
    ).toMatchObject({
      providerName: "YouTube",
      source: "youtube",
      sourceLabel: "YouTube",
      sourceType: "oembed",
      title: "Video Title",
    });
  });
});
