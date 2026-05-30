import { describe, expect, it } from "vitest";
import {
  createRecordingRecord,
  formatRecordingDuration,
  normalizeRecordingDurationSeconds,
  normalizeRecordingMetadata,
} from "../recordingStorageUtils";

describe("recordingStorageUtils", () => {
  it("normalizes recording duration seconds", () => {
    expect(normalizeRecordingDurationSeconds(0)).toBe(0);
    expect(normalizeRecordingDurationSeconds(4.4)).toBe(4);
    expect(normalizeRecordingDurationSeconds(4.6)).toBe(5);
    expect(normalizeRecordingDurationSeconds(-1)).toBe(0);
    expect(normalizeRecordingDurationSeconds("bad")).toBe(0);
  });

  it("formats recording duration", () => {
    expect(formatRecordingDuration(0)).toBe("0:00");
    expect(formatRecordingDuration(9)).toBe("0:09");
    expect(formatRecordingDuration(65)).toBe("1:05");
    expect(formatRecordingDuration(600)).toBe("10:00");
  });

  it("normalizes recording metadata", () => {
    expect(
      normalizeRecordingMetadata({
        durationSeconds: 12.7,
        mimeType: " audio/webm ",
        songId: "song-1",
      }),
    ).toEqual({
      durationSeconds: 13,
      mimeType: "audio/webm",
      songId: "song-1",
    });
  });

  it("creates a recording record", () => {
    const blob = new Blob(["test-audio"], {
      type: "audio/webm",
    });

    const record = createRecordingRecord("recording-1", blob, {
      durationSeconds: 8.4,
      sessionId: "session-1",
      songTitle: "Test Song",
    });

    expect(record.recordingId).toBe("recording-1");
    expect(record.blob).toBe(blob);
    expect(record.mimeType).toBe("audio/webm");
    expect(record.durationSeconds).toBe(8);
    expect(record.sessionId).toBe("session-1");
    expect(record.songTitle).toBe("Test Song");
    expect(record.createdAt).toBeTruthy();
    expect(record.updatedAt).toBeTruthy();
  });

  it("requires a recording id", () => {
    const blob = new Blob(["test-audio"], {
      type: "audio/webm",
    });

    expect(() => createRecordingRecord("", blob)).toThrow("Recording ID is required.");
  });

  it("requires a recording blob", () => {
    expect(() => createRecordingRecord("recording-1")).toThrow("Recording blob is required.");
  });
});
