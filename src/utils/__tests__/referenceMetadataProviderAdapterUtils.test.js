import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getReferenceMetadataProviderSupport,
  normalizeProviderMetadata,
  resolveMockReferenceMetadata,
  resolveReferenceMetadataFromProvider,
  shouldUseMockProviderMetadata,
} from "../referenceMetadataProviderAdapterUtils";

const MOCK_REFERENCE = {
  isValid: true,
  mediaId: "guitar-journey-demo",
  platform: "youtube",
  platformLabel: "YouTube",
  url: "https://www.youtube.com/watch?v=guitar-journey-demo",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("referenceMetadataProviderAdapterUtils", () => {
  it("normalizes provider metadata with extracted markers", () => {
    const metadata = normalizeProviderMetadata(
      {
        authorName: "Demo Author",
        chapterText: "0:00 Intro\n0:12 Verse",
        title: "Demo Song",
      },
      MOCK_REFERENCE,
      "mock",
    );

    expect(metadata).toMatchObject({
      authorName: "Demo Author",
      source: "youtube",
      sourceLabel: "YouTube",
      sourceType: "mock",
      title: "Demo Song",
    });
    expect(metadata.extractedMarkers).toHaveLength(2);
  });

  it("resolves mock metadata for the demo media id", () => {
    const metadata = resolveMockReferenceMetadata(MOCK_REFERENCE);

    expect(metadata).toMatchObject({
      durationSeconds: 274,
      providerName: "YouTube",
      sourceType: "mock",
      title: "Demo Practice Reference",
    });
    expect(metadata.extractedMarkers.length).toBeGreaterThan(4);
  });

  it("detects mock metadata flags", () => {
    expect(
      shouldUseMockProviderMetadata({
        ...MOCK_REFERENCE,
        mediaId: "anything",
        url: "https://www.youtube.com/watch?v=anything&gjMockChapters=1",
      }),
    ).toBe(true);
  });

  it("reports provider support through the adapter", () => {
    expect(getReferenceMetadataProviderSupport(MOCK_REFERENCE)).toBe("mock");
    expect(
      getReferenceMetadataProviderSupport({
        isValid: true,
        platform: "spotify",
        url: "https://open.spotify.com/track/123",
      }),
    ).toBe("spotify");
  });

  it("resolves direct mock metadata with forced mock", () => {
    const metadata = resolveMockReferenceMetadata(
      {
        ...MOCK_REFERENCE,
        mediaId: "anything",
      },
      { forceMock: true },
    );

    expect(metadata.sourceType).toBe("mock");
    expect(metadata.extractedMarkers.length).toBeGreaterThan(4);
  });

  it("resolves backend metadata before oEmbed fallback", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        metadata: {
          authorName: "Backend Artist",
          chapterText: "0:00 Intro\n0:30 Verse",
          durationSeconds: 210,
          title: "Backend Song",
        },
      }),
    }));

    const metadata = await resolveReferenceMetadataFromProvider(
      {
        ...MOCK_REFERENCE,
        mediaId: "backend-id",
        url: "https://www.youtube.com/watch?v=backend-id",
      },
      {
        endpoint: "/api/reference-metadata",
        fetchImpl,
      },
    );

    expect(metadata).toMatchObject({
      authorName: "Backend Artist",
      durationSeconds: 210,
      sourceType: "backend",
      title: "Backend Song",
    });
    expect(metadata.extractedMarkers).toHaveLength(2);
  });

  it("resolves through the adapter with forced mock", async () => {
    const metadata = await resolveReferenceMetadataFromProvider(
      {
        ...MOCK_REFERENCE,
        mediaId: "anything",
      },
      { forceMock: true },
    );

    expect(metadata.sourceType).toBe("mock");
    expect(metadata.extractedMarkers.length).toBeGreaterThan(4);
  });
});
