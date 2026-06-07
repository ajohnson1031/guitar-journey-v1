import { describe, expect, it, vi } from "vitest";
import {
  REFERENCE_METADATA_API_PATH,
  buildMockReferenceMetadataResponse,
  getMockMetadataKey,
  handleReferenceMetadataMockRequest,
  referenceMetadataMockApiPlugin,
} from "../referenceMetadataMockApiPlugin.js";

function createMockResponse() {
  const chunks = [];

  return {
    chunks,
    end: vi.fn((body) => {
      chunks.push(body);
    }),
    setHeader: vi.fn(),
    statusCode: 200,
  };
}

function getJsonResponse(res) {
  return JSON.parse(res.chunks.join(""));
}

describe("referenceMetadataMockApiPlugin", () => {
  it("exposes the expected API path", () => {
    expect(REFERENCE_METADATA_API_PATH).toBe("/api/reference-metadata");
  });

  it("builds mock metadata from known media id", () => {
    const payload = buildMockReferenceMetadataResponse({
      mediaId: "backend-reference-demo",
      platform: "youtube",
      sourceUrl: "https://www.youtube.com/watch?v=backend-reference-demo",
    });

    expect(payload.metadata).toMatchObject({
      authorName: "Backend Mock Artist",
      durationSeconds: 274,
      mediaId: "backend-reference-demo",
      platform: "youtube",
      sourceType: "backend-mock",
      title: "Backend Mock Practice Reference",
    });
    expect(payload.metadata.chapterText).toContain("0:18 Verse");
  });

  it("uses query flag to select backend mock metadata", () => {
    expect(
      getMockMetadataKey({
        sourceUrl: "https://www.youtube.com/watch?v=abc123&gjBackendMock=1",
      }),
    ).toBe("backend-reference-demo");
  });

  it("responds with metadata for matching requests", () => {
    const req = {
      method: "GET",
      url: "/?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Dbackend-reference-demo&platform=youtube&mediaId=backend-reference-demo",
    };
    const res = createMockResponse();

    handleReferenceMetadataMockRequest(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/json; charset=utf-8");
    expect(getJsonResponse(res).metadata.title).toBe("Backend Mock Practice Reference");
  });

  it("responds with 404 when no mock data matches", () => {
    const req = {
      method: "GET",
      url: "/?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Dabc123&platform=youtube&mediaId=abc123",
    };
    const res = createMockResponse();

    handleReferenceMetadataMockRequest(req, res);

    expect(res.statusCode).toBe(404);
    expect(getJsonResponse(res).error).toBe("No mock reference metadata found for this URL.");
  });

  it("creates a Vite serve-only plugin", () => {
    const plugin = referenceMetadataMockApiPlugin();

    expect(plugin).toMatchObject({
      apply: "serve",
      name: "guitar-journey-reference-metadata-mock-api",
    });
    expect(typeof plugin.configureServer).toBe("function");
  });
});
