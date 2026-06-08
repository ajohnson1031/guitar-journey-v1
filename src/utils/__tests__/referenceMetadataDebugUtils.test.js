import { describe, expect, it } from "vitest";
import {
  getMetadataDebugPayload,
  getMetadataStatusDebugPayload,
  getReferenceMetadataDebugPayload,
  getReferenceTrackDebugPayload,
  sanitizeDebugValue,
  stringifyReferenceMetadataDebugPayload,
  truncateDebugString,
} from "../referenceMetadataDebugUtils";

describe("referenceMetadataDebugUtils", () => {
  it("truncates long strings", () => {
    const value = "a".repeat(1700);

    expect(truncateDebugString(value)).toHaveLength(1601);
    expect(truncateDebugString(value).endsWith("…")).toBe(true);
  });

  it("sanitizes nested debug values", () => {
    const value = sanitizeDebugValue({
      keep: "yes",
      nested: {
        remove: undefined,
        fn: () => null,
      },
    });

    expect(value).toEqual({
      keep: "yes",
      nested: {},
    });
  });

  it("creates metadata payloads", () => {
    expect(
      getMetadataDebugPayload({
        authorName: "Artist",
        durationSeconds: 274,
        extractedMarkers: [{ label: "Intro", seconds: 0, time: "0:00" }],
        sourceType: "backend",
        title: "Song",
      }),
    ).toMatchObject({
      authorName: "Artist",
      durationSeconds: 274,
      extractedMarkers: [{ id: "", label: "Intro", seconds: 0, time: "0:00" }],
      sourceType: "backend",
      title: "Song",
    });
  });

  it("creates reference track and status payloads", () => {
    expect(
      getReferenceTrackDebugPayload({
        isValid: true,
        mediaId: "abc123",
        platform: "youtube",
        url: "https://example.com",
      }),
    ).toMatchObject({
      isValid: true,
      mediaId: "abc123",
      platform: "youtube",
      url: "https://example.com",
    });

    expect(
      getMetadataStatusDebugPayload({
        message: "Detected",
        sourceType: "backend",
        tone: "success",
      }),
    ).toMatchObject({
      message: "Detected",
      sourceType: "backend",
      tone: "success",
    });
  });

  it("stringifies the full debug payload", () => {
    const payload = getReferenceMetadataDebugPayload({
      metadata: {
        title: "Song",
      },
      metadataStatus: {
        tone: "success",
      },
      referenceTrack: {
        url: "https://example.com",
      },
    });

    expect(stringifyReferenceMetadataDebugPayload(payload)).toContain('"metadata"');
    expect(stringifyReferenceMetadataDebugPayload(payload)).toContain('"referenceTrack"');
  });
});
