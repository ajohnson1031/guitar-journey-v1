import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { setSharedMetronomeRunning } from "../../hooks/useSharedMetronomeState";
import SongPlaythroughPreview from "../SongPlaythroughPreview";

function createSong(overrides = {}) {
  return {
    bpm: 86,
    id: "greensleeves",
    sections: [
      {
        name: "Verse",
        progression: "Em - G - D - Bm",
      },
      {
        name: "Refrain",
        progression: "G - D - Bm - Em",
      },
    ],
    title: "Greensleeves",
    ...overrides,
  };
}

describe("SongPlaythroughPreview", () => {
  afterEach(() => {
    cleanup();
    setSharedMetronomeRunning(false);
  });

  it("renders a playable chord timeline from song sections", () => {
    render(<SongPlaythroughPreview selectedSong={createSong()} />);

    expect(screen.getByRole("button", { name: /Play melody playthrough/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Turn loop on/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Start metronome/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Play backing track/i })).toBeTruthy();
    expect(screen.getByText("86 BPM")).toBeTruthy();
    expect(screen.getByText("8 chords")).toBeTruthy();
    expect(screen.getByText("2 sections")).toBeTruthy();
    expect(screen.getAllByText("Em").length).toBeGreaterThan(1);
  });

  it("falls back to a disabled empty state when no sections or chords exist", () => {
    render(
      <SongPlaythroughPreview
        selectedSong={{
          bpm: 72,
          chords: [],
          id: "empty-song",
          sections: [],
          title: "Empty Song",
        }}
      />,
    );

    expect(screen.getByText("No playable sections yet.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Play melody playthrough/i }).disabled).toBe(true);
    expect(screen.getByRole("button", { name: /Turn loop on/i }).disabled).toBe(true);
    expect(screen.getByRole("button", { name: /Start metronome/i }).disabled).toBe(false);
    expect(screen.getByRole("button", { name: /Play backing track/i }).disabled).toBe(true);
  });
});
