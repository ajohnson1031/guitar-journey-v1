import { describe, expect, it, vi } from "vitest";
import {
  buildReferenceMetadataRequest,
  buildReferenceMetadataUrl,
  getReferenceMetadataFromBackend,
  normalizeBackendReferenceMetadataResponse,
  unwrapReferenceMetadataResponse,
  validateReferenceMetadataRequest,
} from "../referenceMetadataBackendContractUtils";

const REFERENCE_TRACK = {
  embedUrl: "https://www.youtube.com/embed/abc123",
  isValid: true,
  kind: "video",
  mediaId: "abc123",
  platform: "youtube",
  platformLabel: "YouTube",
  url: "https://www.youtube.com/watch?v=abc123",
};

describe("referenceMetadataBackendContractUtils", () => {
  it("builds a normalized backend request", () => {
    expect(buildReferenceMetadataRequest(REFERENCE_TRACK)).toEqual({
      embedUrl: "https://www.youtube.com/embed/abc123",
      kind: "video",
      mediaId: "abc123",
      platform: "youtube",
      platformLabel: "YouTube",
      sourceUrl: "https://www.youtube.com/watch?v=abc123",
    });
  });

  it("validates request shape", () => {
    expect(validateReferenceMetadataRequest({ sourceUrl: "https://example.com" })).toEqual({
      isValid: true,
      error: "",
    });

    expect(validateReferenceMetadataRequest({})).toEqual({
      isValid: false,
      error: "Reference metadata request requires a sourceUrl.",
    });
  });

  it("builds relative endpoint URLs", () => {
    const url = buildReferenceMetadataUrl(REFERENCE_TRACK, "/api/reference-metadata");

    expect(url).toContain("/api/reference-metadata?");
    expect(url).toContain("platform=youtube");
    expect(url).toContain("mediaId=abc123");
    expect(url).toContain("url=");
  });

  it("unwraps common backend response shapes", () => {
    expect(unwrapReferenceMetadataResponse({ metadata: { title: "Song" } })).toEqual({ title: "Song" });
    expect(unwrapReferenceMetadataResponse({ data: { title: "Song" } })).toEqual({ title: "Song" });
    expect(unwrapReferenceMetadataResponse({ title: "Song" })).toEqual({ title: "Song" });
  });

  it("normalizes backend metadata and extracts markers", () => {
    const metadata = normalizeBackendReferenceMetadataResponse(
      {
        metadata: {
          authorName: "Demo Artist",
          chapterText: "0:00 Intro\n0:12 Verse",
          durationSeconds: 274,
          title: "Demo Song",
        },
      },
      REFERENCE_TRACK,
    );

    expect(metadata).toMatchObject({
      authorName: "Demo Artist",
      durationSeconds: 274,
      source: "youtube",
      sourceLabel: "YouTube",
      sourceType: "backend",
      title: "Demo Song",
    });
    expect(metadata.extractedMarkers).toHaveLength(2);
  });

  it("fetches metadata from backend when available", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        metadata: {
          authorName: "Backend Artist",
          chapterText: "0:00 Intro\n0:20 Verse",
          durationSeconds: 180,
          title: "Backend Song",
        },
      }),
    }));

    const metadata = await getReferenceMetadataFromBackend(REFERENCE_TRACK, {
      endpoint: "/api/reference-metadata",
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(metadata).toMatchObject({
      authorName: "Backend Artist",
      durationSeconds: 180,
      sourceType: "backend",
      title: "Backend Song",
    });
    expect(metadata.extractedMarkers).toHaveLength(2);
  });

  it("returns null when backend is unavailable", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      json: async () => ({}),
    }));

    await expect(
      getReferenceMetadataFromBackend(REFERENCE_TRACK, {
        endpoint: "/api/reference-metadata",
        fetchImpl,
      }),
    ).resolves.toBeNull();
  });
});
