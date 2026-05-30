import { describe, expect, it } from "vitest";
import {
  getLevelBarStates,
  getMicrophoneLevelFromTimeDomainData,
  getTimeDomainRmsLevel,
  isUninitializedTimeDomainData,
  normalizeMicrophoneLevel,
} from "../microphoneTestUtils";

describe("microphoneTestUtils", () => {
  it("normalizes microphone levels", () => {
    expect(normalizeMicrophoneLevel(-1)).toBe(0);
    expect(normalizeMicrophoneLevel(0)).toBe(0);
    expect(normalizeMicrophoneLevel(0.42)).toBe(0.42);
    expect(normalizeMicrophoneLevel(2)).toBe(1);
    expect(normalizeMicrophoneLevel("bad")).toBe(0);
  });

  it("detects uninitialized time-domain buffers", () => {
    expect(isUninitializedTimeDomainData(new Uint8Array([0, 0, 0, 0]))).toBe(true);
    expect(isUninitializedTimeDomainData(new Uint8Array([128, 128, 128, 128]))).toBe(false);
    expect(isUninitializedTimeDomainData(new Uint8Array([128, 130, 126, 128]))).toBe(false);
  });

  it("returns no RMS level for silence or an uninitialized buffer", () => {
    const silence = new Uint8Array([128, 128, 128, 128]);
    const uninitializedBuffer = new Uint8Array([0, 0, 0, 0]);

    expect(getTimeDomainRmsLevel(silence)).toBe(0);
    expect(getMicrophoneLevelFromTimeDomainData(silence)).toBe(0);
    expect(getTimeDomainRmsLevel(uninitializedBuffer)).toBe(0);
    expect(getMicrophoneLevelFromTimeDomainData(uninitializedBuffer)).toBe(0);
  });

  it("returns a positive level for signal", () => {
    const signal = new Uint8Array([100, 112, 128, 144, 156]);

    expect(getTimeDomainRmsLevel(signal)).toBeGreaterThan(0);
    expect(getMicrophoneLevelFromTimeDomainData(signal)).toBeGreaterThan(0);
  });

  it("does not max out on ordinary low-level signal", () => {
    const signal = new Uint8Array([124, 126, 128, 130, 132]);

    expect(getMicrophoneLevelFromTimeDomainData(signal)).toBeLessThan(1);
  });

  it("creates active bar states from level", () => {
    expect(getLevelBarStates(0, 5)).toEqual([false, false, false, false, false]);
    expect(getLevelBarStates(0.4, 5)).toEqual([true, true, false, false, false]);
    expect(getLevelBarStates(1, 5)).toEqual([true, true, true, true, true]);
  });

  it("falls back to at least one bar", () => {
    expect(getLevelBarStates(1, 0)).toEqual([true]);
  });
});
