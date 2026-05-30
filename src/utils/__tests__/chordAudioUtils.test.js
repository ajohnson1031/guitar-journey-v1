import { describe, expect, it } from "vitest";
import {
  getChordFrequencies,
  getChordToneOffsets,
  getChordTones,
  getFrequencyForNote,
  getNoteNameForSemitone,
  getSemitoneForNote,
  normalizeChordName,
  normalizeNoteName,
  parseChordName,
} from "../chordAudioUtils";

function expectFrequencyClose(received, expected) {
  expect(received).toBeGreaterThan(expected - 0.01);
  expect(received).toBeLessThan(expected + 0.01);
}

describe("chordAudioUtils", () => {
  it("normalizes note and chord names", () => {
    expect(normalizeNoteName("f#")).toBe("F#");
    expect(normalizeNoteName("bb")).toBe("Bb");
    expect(normalizeNoteName("bad")).toBe("B");

    expect(normalizeChordName(" G / B ")).toBe("G/B");
    expect(normalizeChordName("(F#7)")).toBe("F#7");
  });

  it("maps notes to semitones and semitones to note names", () => {
    expect(getSemitoneForNote("C")).toBe(0);
    expect(getSemitoneForNote("F#")).toBe(6);
    expect(getSemitoneForNote("Gb")).toBe(6);
    expect(getSemitoneForNote("Bb")).toBe(10);
    expect(getSemitoneForNote("bad")).toBe(11);

    expect(getNoteNameForSemitone(0)).toBe("C");
    expect(getNoteNameForSemitone(13)).toBe("C#");
    expect(getNoteNameForSemitone(-1)).toBe("B");
  });

  it("calculates note frequencies", () => {
    expectFrequencyClose(getFrequencyForNote("A", 4), 440);
    expectFrequencyClose(getFrequencyForNote("C", 4), 261.63);
  });

  it("parses common chord names", () => {
    expect(parseChordName("G")).toEqual({
      root: "G",
      quality: "",
      bass: "",
    });

    expect(parseChordName("Em7")).toEqual({
      root: "E",
      quality: "m7",
      bass: "",
    });

    expect(parseChordName("D/F#")).toEqual({
      root: "D",
      quality: "",
      bass: "F#",
    });

    expect(parseChordName("not-a-chord")).toBeNull();
  });

  it("returns chord tone offsets for common qualities", () => {
    expect(getChordToneOffsets("")).toEqual([0, 4, 7]);
    expect(getChordToneOffsets("m")).toEqual([0, 3, 7]);
    expect(getChordToneOffsets("7")).toEqual([0, 4, 7, 10]);
    expect(getChordToneOffsets("m7")).toEqual([0, 3, 7, 10]);
    expect(getChordToneOffsets("maj7")).toEqual([0, 4, 7, 11]);
    expect(getChordToneOffsets("sus4")).toEqual([0, 5, 7]);
    expect(getChordToneOffsets("dim")).toEqual([0, 3, 6]);
  });

  it("builds major, minor, and seventh chord tones", () => {
    expect(getChordTones("G").map((tone) => tone.note)).toEqual(["G", "B", "D"]);
    expect(getChordTones("Em").map((tone) => tone.note)).toEqual(["E", "G", "B"]);
    expect(getChordTones("F#7").map((tone) => tone.note)).toEqual(["F#", "A#", "C#", "E"]);
  });

  it("includes slash chord bass notes below the chord tones", () => {
    const tones = getChordTones("D/F#");

    expect(tones.map((tone) => tone.note)).toEqual(["F#", "D", "F#", "A"]);
    expect(tones[0].midi).toBeLessThan(tones[1].midi);
  });

  it("returns frequencies for playable chords and an empty list for invalid input", () => {
    expect(getChordFrequencies("C")).toHaveLength(3);
    expect(getChordFrequencies("C").every((frequency) => frequency > 0)).toBe(true);

    expect(getChordFrequencies("not-a-chord")).toEqual([]);
  });
});
