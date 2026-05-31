import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";
import ProgressLibrary from "../ProgressLibrary";

function createSong(overrides = {}) {
  return {
    bpm: 72,
    chords: ["G", "C"],
    difficulty: "Beginner",
    genre: "Worship",
    goal: "Build song confidence.",
    id: "song-test",
    key: "G",
    sections: [],
    strumming: "Down strums",
    title: "Test Song",
    transitions: [],
    ...overrides,
  };
}

function createSession(overrides = {}) {
  return {
    completedAt: "2026-05-30T12:00:00.000Z",
    elapsedSeconds: 1200,
    id: "session-test",
    minutes: 20,
    songId: "song-test",
    songTitle: "Test Song",
    ...overrides,
  };
}

function renderProgressLibrary(props = {}) {
  return render(
    <ProgressLibrary
      allSongs={[]}
      completedStepsBySong={{}}
      masteredSongs={{}}
      pathOptions={["Worship", "Blues", "Neo Soul", "Rock"]}
      sessionHistory={[]}
      {...props}
    />,
  );
}

describe("ProgressLibrary", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders mastered and in-progress songs with summary cards", () => {
    renderProgressLibrary({
      allSongs: [
        createSong({
          id: "mastered-song",
          title: "Mastered Song",
        }),
        createSong({
          genre: "Blues",
          id: "in-progress-song",
          title: "In Progress Blues",
        }),
      ],
      masteredSongs: {
        "mastered-song": true,
      },
      sessionHistory: [
        createSession({
          songId: "in-progress-song",
          songTitle: "In Progress Blues",
        }),
      ],
    });

    expect(screen.getByText("Mastered Song")).toBeTruthy();
    expect(screen.getByText("In Progress Blues")).toBeTruthy();
    expect(screen.getByText("tracked")).toBeTruthy();
    expect(screen.getByText("mastered")).toBeTruthy();
    expect(screen.getByText("in progress")).toBeTruthy();
    expect(screen.getAllByText("Mastered").length).toBeGreaterThan(0);
    expect(screen.getAllByText("In Progress").length).toBeGreaterThan(0);
  });

  it("filters songs by search, status, and genre", () => {
    renderProgressLibrary({
      allSongs: [
        createSong({
          genre: "Worship",
          id: "worship-song",
          title: "Worship Song",
        }),
        createSong({
          genre: "Blues",
          id: "blues-song",
          title: "Blues Song",
        }),
      ],
      masteredSongs: {
        "worship-song": true,
      },
      sessionHistory: [
        createSession({
          songId: "blues-song",
          songTitle: "Blues Song",
        }),
      ],
    });

    fireEvent.change(screen.getByLabelText("Search progress"), {
      target: {
        value: "blues",
      },
    });

    expect(screen.queryByText("Worship Song")).toBeNull();
    expect(screen.getByText("Blues Song")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Mastered" }));

    expect(screen.getByText("No progress matches this filter")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Search progress"), {
      target: {
        value: "",
      },
    });
    fireEvent.change(screen.getByLabelText("Genre"), {
      target: {
        value: "Worship",
      },
    });

    expect(screen.getByText("Worship Song")).toBeTruthy();
    expect(screen.queryByText("Blues Song")).toBeNull();
  });

  it("sorts progress by most practice time", () => {
    const { container } = renderProgressLibrary({
      allSongs: [
        createSong({
          id: "short-song",
          title: "Short Song",
        }),
        createSong({
          id: "long-song",
          title: "Long Song",
        }),
      ],
      sessionHistory: [
        createSession({
          elapsedSeconds: 300,
          songId: "short-song",
          songTitle: "Short Song",
        }),
        createSession({
          elapsedSeconds: 1800,
          songId: "long-song",
          songTitle: "Long Song",
        }),
      ],
    });

    fireEvent.change(screen.getByLabelText("Sort"), {
      target: {
        value: "most-time",
      },
    });

    const cards = Array.from(container.querySelectorAll(".progress-song-card"));

    expect(cards[0].textContent).toContain("Long Song");
    expect(cards[1].textContent).toContain("Short Song");
  });

  it("renders the empty state when there is no progress yet", () => {
    renderProgressLibrary({
      allSongs: [
        createSong({
          id: "unstarted-song",
          title: "Unstarted Song",
        }),
      ],
    });

    expect(screen.getByText("No song progress yet")).toBeTruthy();
  });
});
