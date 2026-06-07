import { describe, expect, it } from "vitest";
import {
  createReferenceMetadataSourceStatus,
  getReferenceMetadataSourceClassName,
  getReferenceMetadataSourceDescription,
  getReferenceMetadataSourceLabel,
  getReferenceMetadataSourceType,
  normalizeMetadataSourceType,
} from "../referenceMetadataSourceUtils";

describe("referenceMetadataSourceUtils", () => {
  it("normalizes source types", () => {
    expect(normalizeMetadataSourceType("backend_mock")).toBe("backend-mock");
    expect(normalizeMetadataSourceType("o-embed")).toBe("oembed");
    expect(normalizeMetadataSourceType("")).toBe("unknown");
  });

  it("reads source type from metadata", () => {
    expect(getReferenceMetadataSourceType({ sourceType: "backend" })).toBe("backend");
    expect(getReferenceMetadataSourceType({ source: "oembed" })).toBe("oembed");
    expect(getReferenceMetadataSourceType("mock")).toBe("mock");
  });

  it("returns display labels", () => {
    expect(getReferenceMetadataSourceLabel("backend")).toBe("Backend");
    expect(getReferenceMetadataSourceLabel("backend-mock")).toBe("Backend Mock");
    expect(getReferenceMetadataSourceLabel("oembed")).toBe("oEmbed");
    expect(getReferenceMetadataSourceLabel("manual")).toBe("Manual");
  });

  it("returns descriptions and css class names", () => {
    expect(getReferenceMetadataSourceDescription("backend")).toContain("/api/reference-metadata");
    expect(getReferenceMetadataSourceClassName("backend-mock")).toBe("is-backend-mock");
  });

  it("creates source status objects", () => {
    expect(createReferenceMetadataSourceStatus({ sourceType: "oembed" })).toMatchObject({
      label: "oEmbed",
      sourceType: "oembed",
    });
  });
});
