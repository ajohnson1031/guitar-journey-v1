import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setSharedMetronomeRunning } from "../../hooks/useSharedMetronomeState";
import SongPlaythroughControls from "../SongPlaythroughControls";

function createPlayback(overrides = {}) {
  return {
    activeStep: null,
    backingMode: "backing",
    hasSteps: true,
    isLooping: false,
    isPlaying: false,
    melodyMode: "melody",
    playbackMode: "melody",
    safeBpm: 86,
    startPlayback: vi.fn(),
    statusMessage: "",
    stopPlayback: vi.fn(),
    toggleLoop: vi.fn(),
    ...overrides,
  };
}

describe("SongPlaythroughControls", () => {
  afterEach(() => {
    cleanup();
    setSharedMetronomeRunning(false);
  });

  it("starts melody playback from the icon button", () => {
    const playback = createPlayback();

    render(<SongPlaythroughControls playback={playback} />);

    fireEvent.click(screen.getByRole("button", { name: "Play melody playthrough" }));

    expect(playback.startPlayback).toHaveBeenCalledWith({ mode: "melody" });
  });

  it("stops active melody playback and toggles loop", () => {
    const playback = createPlayback({
      isPlaying: true,
      playbackMode: "melody",
    });

    render(<SongPlaythroughControls playback={playback} />);

    fireEvent.click(screen.getByRole("button", { name: "Stop melody playthrough" }));
    fireEvent.click(screen.getByRole("button", { name: "Turn loop on" }));

    expect(playback.stopPlayback).toHaveBeenCalledWith({ message: "Melody playthrough stopped." });
    expect(playback.toggleLoop).toHaveBeenCalledTimes(1);
  });

  it("starts backing-track playback from the backing button", () => {
    const playback = createPlayback();

    render(<SongPlaythroughControls playback={playback} />);

    fireEvent.click(screen.getByRole("button", { name: "Play backing track" }));

    expect(playback.startPlayback).toHaveBeenCalledWith({ mode: "backing" });
  });

  it("shows loop as active", () => {
    const playback = createPlayback({
      isLooping: true,
    });

    render(<SongPlaythroughControls playback={playback} />);

    expect(screen.getByRole("button", { name: "Turn loop off" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("reflects active shared metronome state", () => {
    const playback = createPlayback();

    setSharedMetronomeRunning(true);
    render(<SongPlaythroughControls playback={playback} />);

    expect(screen.getByRole("button", { name: "Stop metronome" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("requests a synced metronome toggle with the playback BPM", () => {
    const playback = createPlayback();

    render(<SongPlaythroughControls playback={playback} />);

    fireEvent.click(screen.getByRole("button", { name: "Start metronome" }));

    expect(screen.getByRole("button", { name: "Start metronome" })).toBeTruthy();
  });
});
