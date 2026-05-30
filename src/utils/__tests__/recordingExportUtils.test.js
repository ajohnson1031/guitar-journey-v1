import { describe, expect, it } from "vitest";
import { base64ToBlob, getRecordingDownloadFilename, getRecordingFileExtension, sanitizeFilenamePart } from "../recordingExportUtils";

describe("recordingExportUtils", () => {
  it("sanitizes filename parts", () => {
    expect(sanitizeFilenamePart("A Song: With / Bad * Characters")).toBe("A-Song-With-Bad-Characters");
    expect(sanitizeFilenamePart("", "fallback")).toBe("fallback");
  });

  it("maps recording mime types to file extensions", () => {
    expect(getRecordingFileExtension("audio/webm")).toBe("webm");
    expect(getRecordingFileExtension("audio/ogg")).toBe("ogg");
    expect(getRecordingFileExtension("audio/wav")).toBe("wav");
    expect(getRecordingFileExtension("audio/mp4")).toBe("mp4");
  });

  it("creates useful recording download filenames", () => {
    expect(
      getRecordingDownloadFilename(
        {
          completedAt: "2026-05-30T12:00:00.000Z",
          recordingMimeType: "audio/webm",
          songTitle: "Hotel California",
        },
        {},
      ),
    ).toBe("guitar-journey-Hotel-California-2026-05-30.webm");
  });

  it("converts base64 audio data back into a blob", async () => {
    const blob = base64ToBlob(window.btoa("audio"), "audio/webm");

    expect(blob.type).toBe("audio/webm");
    expect(await blob.text()).toBe("audio");
  });
});
