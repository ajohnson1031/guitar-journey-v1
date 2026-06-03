import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SongImportAssistant from "../SongImportAssistant";

const GREENSLEEVES_SETUP = `Title: Greensleeves
Artist: Traditional
Instrument / Type: Chords
Genre: Folk
Difficulty: Intermediate
Key: Em
Tuning: Standard
Capo: None
BPM: 86

Chords:
Em, G, D, Bm, C, Am, B7

Verse:
Em - G - D - Bm
C - Am - B7 - Em
Em - G - D - Bm
C - B7 - Em - Em

Refrain:
G - D - Bm - Em
C - Am - B7 - B7
G - D - Bm - Em
C - B7 - Em - Em

Practice Goal:
Practice the minor-key chord movement slowly, then loop the Verse and Refrain until the transitions feel smooth.`;

function renderSongImportAssistant(overrides = {}) {
  const props = {
    onApplyAnalysis: vi.fn(() => ({
      appliedFields: ["title", "artist", "genre", "BPM", "chords", "sections"],
      skippedFields: [],
    })),
    ...overrides,
  };

  render(<SongImportAssistant {...props} />);

  return props;
}

describe("SongImportAssistant", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("keeps assistant actions disabled until pasted text is available and analyzed", () => {
    const props = renderSongImportAssistant();
    const textarea = screen.getByLabelText("Practice setup song details");
    const analyzeButton = screen.getByRole("button", { name: "Analyze Paste" });
    const applyButton = screen.getByRole("button", { name: "Apply Analysis" });
    const clearButton = screen.getByRole("button", { name: "Clear Paste" });

    expect(analyzeButton.disabled).toBe(true);
    expect(applyButton.disabled).toBe(true);
    expect(clearButton.disabled).toBe(true);

    fireEvent.change(textarea, {
      target: { value: GREENSLEEVES_SETUP },
    });

    expect(analyzeButton.disabled).toBe(false);
    expect(applyButton.disabled).toBe(true);
    expect(clearButton.disabled).toBe(false);

    fireEvent.click(analyzeButton);

    expect(screen.getByText(/Found 7 chords.*5 details/i)).toBeTruthy();
    expect(screen.getByText("Detected details")).toBeTruthy();
    expect(screen.getByText("Sections")).toBeTruthy();
    expect(screen.getByText("Transitions")).toBeTruthy();
    expect(applyButton.disabled).toBe(false);

    fireEvent.click(applyButton);

    expect(props.onApplyAnalysis).toHaveBeenCalledTimes(1);
    expect(props.onApplyAnalysis.mock.calls[0][0]).toMatchObject({
      artist: "Traditional",
      bpm: 86,
      difficulty: "Intermediate",
      genre: "Folk",
      instrument: "Chords",
      key: "Em",
      title: "Greensleeves",
      tuning: "Standard",
    });
    expect(screen.getByText(/Applied: title, artist, genre, BPM, chords and sections/i)).toBeTruthy();

    fireEvent.click(clearButton);

    expect(textarea.value).toBe("");
    expect(analyzeButton.disabled).toBe(true);
    expect(applyButton.disabled).toBe(true);
    expect(clearButton.disabled).toBe(true);
  });

  it("shows skipped field feedback returned by the apply handler", () => {
    renderSongImportAssistant({
      onApplyAnalysis: vi.fn(() => ({
        appliedFields: ["title", "artist", "chords"],
        skippedFields: ["genre “Country”"],
      })),
    });

    fireEvent.change(screen.getByLabelText("Practice setup song details"), {
      target: { value: GREENSLEEVES_SETUP.replace("Genre: Folk", "Genre: Country") },
    });

    fireEvent.click(screen.getByRole("button", { name: "Analyze Paste" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply Analysis" }));

    expect(screen.getByText(/Applied: title, artist and chords/i)).toBeTruthy();
    expect(screen.getByText(/Not applied: genre “Country”/i)).toBeTruthy();
    expect(screen.getByText(/Add a matching genre first/i)).toBeTruthy();
  });

  it("opens a setup explainer dialog with copy and paste sample actions", () => {
    renderSongImportAssistant();

    fireEvent.click(screen.getByRole("button", { name: "How to use Practice Setup Assistant" }));

    expect(screen.getByRole("dialog", { name: "How to use the assistant" })).toBeTruthy();
    expect(screen.getByText(/traditional Greensleeves sample/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Copy Sample" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Use Sample" })).toBeTruthy();
    expect(screen.getByDisplayValue(/Title: Greensleeves/)).toBeTruthy();
  });

  it("can insert the public-domain-style sample into the assistant textarea", () => {
    renderSongImportAssistant();
    const textarea = screen.getByLabelText("Practice setup song details");

    fireEvent.click(screen.getByRole("button", { name: "How to use Practice Setup Assistant" }));
    fireEvent.click(screen.getByRole("button", { name: "Use Sample" }));

    expect(screen.queryByRole("dialog", { name: "How to use the assistant" })).toBeNull();
    expect(textarea.value).toContain("Title: Greensleeves");
    expect(textarea.value).toContain("Refrain:");
    expect(screen.getByRole("button", { name: "Analyze Paste" }).disabled).toBe(false);
  });
});
