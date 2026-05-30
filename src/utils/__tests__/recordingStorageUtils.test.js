import { describe, expect, it } from "vitest";
import { getRecordingSummaryLabel, getSessionRecordingIds } from "../recordingStorageUtils";

describe("recordingStorageUtils", () => {
  it("collects linked recording ids from session history", () => {
    expect(
      Array.from(
        getSessionRecordingIds([
          {
            recordingId: "recording-one",
          },
          {
            recordingId: "",
          },
          {
            recordingId: "recording-two",
          },
        ]),
      ),
    ).toEqual(["recording-one", "recording-two"]);
  });

  it("shows a simple label when all stored recordings are linked", () => {
    expect(
      getRecordingSummaryLabel({
        linkedStoredCount: 2,
        missingLinkedCount: 0,
        orphanedCount: 0,
        storedCount: 2,
      }),
    ).toBe("2 recordings");
  });

  it("shows orphaned and missing recordings when storage and history are out of sync", () => {
    expect(
      getRecordingSummaryLabel({
        linkedStoredCount: 1,
        missingLinkedCount: 1,
        orphanedCount: 2,
        storedCount: 3,
      }),
    ).toBe("1 linked • 2 orphaned • 1 missing");
  });
});
