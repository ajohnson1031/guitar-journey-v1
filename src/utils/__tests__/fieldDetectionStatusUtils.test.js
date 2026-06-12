import { describe, expect, it } from "vitest";
import {
  createFieldDetectionStatus,
  getFieldDetectionStatusClassName,
  hasFieldDetectionValue,
} from "../fieldDetectionStatusUtils";

describe("fieldDetectionStatusUtils", () => {
  it("detects non-empty scalar and array values", () => {
    expect(hasFieldDetectionValue("Guitar")).toBe(true);
    expect(hasFieldDetectionValue(["G", "C"])).toBe(true);
    expect(hasFieldDetectionValue("")).toBe(false);
    expect(hasFieldDetectionValue([])).toBe(false);
  });

  it("marks missing fields as requiring action", () => {
    const status = createFieldDetectionStatus({
      message: "Song chapters could not be automatically extracted.",
      status: "missing",
      value: "",
    });

    expect(status.label).toBe("Missing");
    expect(status.requiresAction).toBe(true);
    expect(status.description).toContain("Song chapters");
  });

  it("marks detected fields as reviewable and acceptable", () => {
    const status = createFieldDetectionStatus({
      sourceLabel: "Backend Mock",
      status: "detected",
      value: "Song Title",
    });

    expect(status.label).toBe("Detected");
    expect(status.requiresAction).toBe(false);
    expect(status.canAccept).toBe(true);
    expect(status.description).toBe("Backend Mock");
  });

  it("marks accepted fields as resolved without an accept action", () => {
    const status = createFieldDetectionStatus({
      status: "accepted",
      value: "Song Title",
    });

    expect(status.label).toBe("Accepted");
    expect(status.requiresAction).toBe(false);
    expect(status.canAccept).toBe(false);
    expect(getFieldDetectionStatusClassName("accepted")).toBe("is-accepted");
  });

  it("supports needs-review and overridden class names", () => {
    expect(getFieldDetectionStatusClassName("needs-review")).toBe("is-needs-review");
    expect(getFieldDetectionStatusClassName("overridden")).toBe("is-overridden");
  });
});
