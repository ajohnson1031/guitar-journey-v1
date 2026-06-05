import { describe, expect, it } from "vitest";
import { createPlaythroughSteps, getChordFrequencies, getSafePlaybackBpm, parseProgressionToChords } from "../songPlaythroughUtils";

describe("songPlaythroughUtils", () => {
  it("parses standard section progressions into chord names", () => {
    expect(parseProgressionToChords("G - C - G - D")).toEqual(["G", "C", "G", "D"]);
  });

  it("parses slash-separated 12-bar progressions without losing dominant chords", () => {
    expect(parseProgressionToChords("E7 - E7 - E7 - E7 / A7 - A7 - E7 - E7 / B7 - A7 - E7 - B7")).toEqual([
      "E7",
      "E7",
      "E7",
      "E7",
      "A7",
      "A7",
      "E7",
      "E7",
      "B7",
      "A7",
      "E7",
      "B7",
    ]);
  });

  it("creates playthrough steps from sections and falls back to chord list", () => {
    const sectionSteps = createPlaythroughSteps({
      sections: [
        {
          name: "Verse",
          progression: "Em - G - D - Bm",
        },
      ],
    });

    expect(sectionSteps).toEqual([
      expect.objectContaining({ chord: "Em", sectionName: "Verse" }),
      expect.objectContaining({ chord: "G", sectionName: "Verse" }),
      expect.objectContaining({ chord: "D", sectionName: "Verse" }),
      expect.objectContaining({ chord: "Bm", sectionName: "Verse" }),
    ]);

    expect(
      createPlaythroughSteps({
        chords: ["G", "C"],
        sections: [],
      }),
    ).toEqual([
      expect.objectContaining({ chord: "G", sectionName: "Song" }),
      expect.objectContaining({ chord: "C", sectionName: "Song" }),
    ]);
  });

  it("generates simple chord frequencies", () => {
    expect(getChordFrequencies("Em")).toHaveLength(3);
    expect(getChordFrequencies("G7")).toHaveLength(4);
    expect(getChordFrequencies("Cmaj7")[0]).toBeGreaterThan(100);
  });

  it("clamps playback BPM to a safe range", () => {
    expect(getSafePlaybackBpm(20)).toBe(40);
    expect(getSafePlaybackBpm(240)).toBe(220);
    expect(getSafePlaybackBpm("86")).toBe(86);
    expect(getSafePlaybackBpm("not a number")).toBe(72);
  });
});
