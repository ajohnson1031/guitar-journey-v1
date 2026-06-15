import { describe, expect, it } from "vitest";
import {
  getRequiredSongSetupCompletion,
  getRequiredSongSetupItems,
  hasRequiredSetupValue,
} from "../songSetupCompletionUtils";

describe("songSetupCompletionUtils", () => {
  it("detects required scalar values", () => {
    expect(hasRequiredSetupValue("G")).toBe(true);
    expect(hasRequiredSetupValue("")).toBe(false);
    expect(hasRequiredSetupValue("   ")).toBe(false);
  });

  it("builds required setup completion items", () => {
    const items = getRequiredSongSetupItems({
      chordCount: 4,
      difficulty: "Intermediate",
      genre: "Folk",
      hasRhythm: true,
      key: "G",
      title: "Greensleeves",
    });

    expect(items).toHaveLength(6);
    expect(items.every((item) => item.isComplete)).toBe(true);
  });

  it("calculates completion percentage", () => {
    const items = getRequiredSongSetupItems({
      chordCount: 0,
      difficulty: "Beginner",
      genre: "Worship",
      hasRhythm: false,
      key: "",
      title: "Test Song",
    });
    const completion = getRequiredSongSetupCompletion(items);

    expect(completion.completed).toBe(3);
    expect(completion.total).toBe(6);
    expect(completion.percent).toBe(50);
  });
});
