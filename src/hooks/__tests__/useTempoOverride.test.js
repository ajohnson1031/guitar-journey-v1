import { describe, expect, it } from "vitest";
import { clearTemporarySongBpm, getEffectiveSongBpm, isSongBpmAdjusted, setTemporarySongBpm } from "../useTempoOverride";

const SONG = {
  bpm: 86,
  id: "greensleeves",
  title: "Greensleeves",
};

describe("useTempoOverride helpers", () => {
  it("applies and clears a temporary BPM override", () => {
    clearTemporarySongBpm(SONG.id);

    expect(getEffectiveSongBpm(SONG)).toBe(86);
    expect(isSongBpmAdjusted(SONG)).toBe(false);

    setTemporarySongBpm(SONG, 72);

    expect(getEffectiveSongBpm(SONG)).toBe(72);
    expect(isSongBpmAdjusted(SONG)).toBe(true);

    clearTemporarySongBpm(SONG.id);

    expect(getEffectiveSongBpm(SONG)).toBe(86);
    expect(isSongBpmAdjusted(SONG)).toBe(false);
  });

  it("clears the override when the adjusted BPM matches the original BPM", () => {
    setTemporarySongBpm(SONG, 70);
    expect(isSongBpmAdjusted(SONG)).toBe(true);

    setTemporarySongBpm(SONG, 86);

    expect(getEffectiveSongBpm(SONG)).toBe(86);
    expect(isSongBpmAdjusted(SONG)).toBe(false);
  });
});
