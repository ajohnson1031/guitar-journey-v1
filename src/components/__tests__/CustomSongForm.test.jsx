import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DOWN_STRUM, UP_STRUM } from "../../constants";
import { EIGHTH_STRUMMING_SUBDIVISION, SIXTEENTH_STRUMMING_SUBDIVISION } from "../../utils/strummingUtils";
import CustomSongForm from "../CustomSongForm";

const { Fragment } = React;

const GENRES = ["Worship", "Blues", "Neo Soul", "Folk"];

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

function createProps(overrides = {}) {
  return {
    editingSong: null,
    genres: GENRES,
    onAddSong: vi.fn(),
    onCancelEdit: vi.fn(),
    onClose: vi.fn(),
    onOpenChange: vi.fn(),
    onUpdateSong: vi.fn(),
    ...overrides,
  };
}

function renderCustomSongForm(props = {}) {
  const mergedProps = createProps(props);

  render(
    <Fragment>
      <CustomSongForm {...mergedProps} />
    </Fragment>,
  );

  return mergedProps;
}

function fillRequiredNewSongFields() {
  fireEvent.change(screen.getByLabelText("Song Title"), {
    target: { value: "Custom Test Song" },
  });
  fireEvent.change(screen.getByLabelText("Artist"), {
    target: { value: "Aaron Johnson" },
  });
  fireEvent.change(screen.getByLabelText("Instrument / Type"), {
    target: { value: "Chords" },
  });
  fireEvent.change(screen.getByLabelText("Genre"), {
    target: { value: "Neo Soul" },
  });
  fireEvent.change(screen.getByLabelText("Difficulty"), {
    target: { value: "Intermediate" },
  });
  fireEvent.change(screen.getByLabelText("Key"), {
    target: { value: "G" },
  });
  fireEvent.change(screen.getByLabelText("Tuning"), {
    target: { value: "Standard" },
  });
  fireEvent.change(screen.getByLabelText("BPM"), {
    target: { value: "88" },
  });
  fireEvent.change(screen.getByLabelText("Capo"), {
    target: { value: "No capo" },
  });
  fireEvent.change(screen.getByLabelText("Chords"), {
    target: { value: "G, C, Em, D" },
  });
  fireEvent.change(screen.getByLabelText("Transitions"), {
    target: { value: "G → C, C → Em, Em → D" },
  });
  fireEvent.change(screen.getByLabelText("Song Sections"), {
    target: { value: "Verse: G - C - Em - D\nChorus: C - G - D - Em" },
  });
  fireEvent.change(screen.getByLabelText("Practice Goal"), {
    target: { value: "Practice this custom song with clean timing." },
  });

  fireEvent.click(screen.getByLabelText("Set 1 to down strum"));
}

function createEditingSong() {
  return {
    id: "custom-existing-song",
    title: "Existing Song",
    artist: "Existing Artist",
    instrument: "Chords",
    genre: "Worship",
    key: "G",
    tuning: "Standard",
    capo: "No capo",
    bpm: 72,
    difficulty: "Beginner",
    chords: ["G", "C", "Em", "D"],
    transitions: ["G → C", "C → Em"],
    sections: [
      {
        name: "Verse",
        progression: "G - C - Em - D",
      },
    ],
    strumming: `${DOWN_STRUM} · ${DOWN_STRUM} ${UP_STRUM} · · · ·`,
    strummingPattern: {
      subdivision: EIGHTH_STRUMMING_SUBDIVISION,
      slots: [
        { slot: 0, beat: "1", direction: DOWN_STRUM },
        { slot: 1, beat: "&", direction: "" },
        { slot: 2, beat: "2", direction: DOWN_STRUM },
        { slot: 3, beat: "&", direction: UP_STRUM },
        { slot: 4, beat: "3", direction: "" },
        { slot: 5, beat: "&", direction: "" },
        { slot: 6, beat: "4", direction: "" },
        { slot: 7, beat: "&", direction: "" },
      ],
    },
    goal: "Practice the existing song.",
    source: "",
    sourceUrl: "",
    isCustom: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function analyzeAndApplySetupText(text = GREENSLEEVES_SETUP) {
  fireEvent.change(screen.getByLabelText("Practice setup song details"), {
    target: { value: text },
  });

  fireEvent.click(screen.getByRole("button", { name: "Analyze Paste" }));
  fireEvent.click(screen.getByRole("button", { name: "Apply Analysis" }));
}

describe("CustomSongForm", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("stays closed when defaultOpen is false", () => {
    const props = renderCustomSongForm();

    expect(screen.getByRole("heading", { name: "Add Custom Song" })).toBeTruthy();
    expect(screen.queryByLabelText("Song Title")).toBeNull();
    expect(screen.queryByRole("button", { name: "Add Song" })).toBeNull();
    expect(props.onOpenChange).not.toHaveBeenCalled();
  });

  it("renders open immediately when defaultOpen is true", () => {
    const props = renderCustomSongForm({
      defaultOpen: true,
      showToggle: false,
    });

    expect(screen.getByLabelText("Song Title")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    expect(props.onOpenChange).toHaveBeenCalledWith(true);
  });

  it("shows validation and does not save when the title is missing", () => {
    const props = renderCustomSongForm({
      defaultOpen: true,
      showToggle: false,
    });

    fireEvent.click(screen.getByRole("button", { name: "Save Custom Song" }));

    expect(screen.getByText("Add a song title before saving.")).toBeTruthy();
    expect(props.onAddSong).not.toHaveBeenCalled();
    expect(props.onUpdateSong).not.toHaveBeenCalled();
  });

  it("requires at least one strum before saving", () => {
    const props = renderCustomSongForm({
      defaultOpen: true,
      showToggle: false,
    });

    fireEvent.change(screen.getByLabelText("Song Title"), {
      target: { value: "No Strum Song" },
    });
    fireEvent.change(screen.getByLabelText("Genre"), {
      target: { value: "Worship" },
    });
    fireEvent.change(screen.getByLabelText("Key"), {
      target: { value: "G" },
    });
    fireEvent.change(screen.getByLabelText("Difficulty"), {
      target: { value: "Beginner" },
    });
    fireEvent.change(screen.getByLabelText("Chords"), {
      target: { value: "G, C, D" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save Custom Song" }));

    expect(screen.getByText("Add at least one down or up strum to the strumming pattern.")).toBeTruthy();
    expect(props.onAddSong).not.toHaveBeenCalled();
  });

  it("saves a new custom song with parsed fields and v2 strumming data", () => {
    const props = renderCustomSongForm({
      defaultOpen: true,
      showToggle: false,
    });

    fillRequiredNewSongFields();

    fireEvent.click(screen.getByRole("button", { name: "Save Custom Song" }));

    expect(props.onAddSong).toHaveBeenCalledTimes(1);
    expect(props.onUpdateSong).not.toHaveBeenCalled();

    const savedSong = props.onAddSong.mock.calls[0][0];

    expect(savedSong.id).toMatch(/^custom-custom-test-song-/);
    expect(savedSong.title).toBe("Custom Test Song");
    expect(savedSong.artist).toBe("Aaron Johnson");
    expect(savedSong.instrument).toBe("Chords");
    expect(savedSong.genre).toBe("Neo Soul");
    expect(savedSong.key).toBe("G");
    expect(savedSong.tuning).toBe("Standard");
    expect(savedSong.capo).toBe("No capo");
    expect(savedSong.bpm).toBe(88);
    expect(savedSong.difficulty).toBe("Intermediate");
    expect(savedSong.chords).toEqual(["G", "C", "Em", "D"]);
    expect(savedSong.transitions).toEqual(["G → C", "C → Em", "Em → D"]);
    expect(savedSong.sections).toEqual([
      {
        name: "Verse",
        progression: "G - C - Em - D",
      },
      {
        name: "Chorus",
        progression: "C - G - D - Em",
      },
    ]);
    expect(savedSong.goal).toBe("Practice this custom song with clean timing.");
    expect(savedSong.isCustom).toBe(true);
    expect(savedSong.createdAt).toBeTruthy();
    expect(savedSong.updatedAt).toBeTruthy();

    expect(savedSong.strummingPattern.subdivision).toBe(EIGHTH_STRUMMING_SUBDIVISION);
    expect(savedSong.strummingPattern.slots).toHaveLength(8);
    expect(savedSong.strummingPattern.slots[0].direction).toBe(DOWN_STRUM);
    expect(savedSong.strumming).toBe(`${DOWN_STRUM} · · · · · · ·`);
  });

  it("can save a new custom song with sixteenth-note strumming", () => {
    const props = renderCustomSongForm({
      defaultOpen: true,
      showToggle: false,
    });

    fillRequiredNewSongFields();

    fireEvent.click(screen.getByRole("button", { name: "16th Notes" }));
    fireEvent.click(screen.getAllByLabelText("Set e to up strum")[0]);

    fireEvent.click(screen.getByRole("button", { name: "Save Custom Song" }));

    const savedSong = props.onAddSong.mock.calls[0][0];

    expect(savedSong.strummingPattern.subdivision).toBe(SIXTEENTH_STRUMMING_SUBDIVISION);
    expect(savedSong.strummingPattern.slots).toHaveLength(16);
    expect(savedSong.strummingPattern.slots[0].direction).toBe(DOWN_STRUM);
    expect(savedSong.strummingPattern.slots[1].direction).toBe(UP_STRUM);
  });

  it("applies Practice Setup Assistant metadata to manual song fields", () => {
    renderCustomSongForm({
      defaultOpen: true,
      showToggle: false,
    });

    analyzeAndApplySetupText();

    expect(screen.getByLabelText("Song Title").value).toBe("Greensleeves");
    expect(screen.getByLabelText("Artist").value).toBe("Traditional");
    expect(screen.getByLabelText("Instrument / Type").value).toBe("Chords");
    expect(screen.getByLabelText("Genre").value).toBe("Folk");
    expect(screen.getByLabelText("Difficulty").value).toBe("Intermediate");
    expect(screen.getByLabelText("Key").value).toBe("Em");
    expect(screen.getByLabelText("Tuning").value).toBe("Standard");
    expect(screen.getByLabelText("BPM").value).toBe("86");
    expect(screen.getByLabelText("Capo").value).toBe("No capo");
    expect(screen.getByLabelText("Chords").value).toBe("Em, G, D, Bm, C, Am, B7");
    expect(screen.getByLabelText("Transitions").value).toContain("Em → G");
    expect(screen.getByLabelText("Song Sections").value).toContain("Verse: Em - G - D - Bm - C - Am - B7");
    expect(screen.getByLabelText("Song Sections").value).toContain("Refrain: G - D - Bm - Em - C - Am - B7");
    expect(screen.getByLabelText("Practice Goal").value).toContain("Learn Greensleeves");
    expect(screen.getByText("Song analysis applied. Review and edit anything before saving.")).toBeTruthy();
  });

  it("does not auto-create or overwrite an unmatched pasted genre", () => {
    renderCustomSongForm({
      defaultOpen: true,
      genres: ["Worship", "Blues", "Neo Soul"],
      showToggle: false,
    });

    fireEvent.change(screen.getByLabelText("Genre"), {
      target: { value: "Blues" },
    });

    analyzeAndApplySetupText(GREENSLEEVES_SETUP.replace("Genre: Folk", "Genre: Country"));

    expect(screen.getByLabelText("Song Title").value).toBe("Greensleeves");
    expect(screen.getByLabelText("Genre").value).toBe("Blues");
  });

  it("clamps pasted BPM metadata when applying analysis", () => {
    renderCustomSongForm({
      defaultOpen: true,
      showToggle: false,
    });

    analyzeAndApplySetupText(GREENSLEEVES_SETUP.replace("BPM: 86", "BPM: 320"));

    expect(screen.getByLabelText("BPM").value).toBe("220");
  });

  it("prepopulates editing fields and saves updates through onUpdateSong", () => {
    const props = renderCustomSongForm({
      defaultOpen: true,
      editingSong: createEditingSong(),
      showToggle: false,
    });

    expect(screen.getByDisplayValue("Existing Song")).toBeTruthy();
    expect(screen.getByDisplayValue("Existing Artist")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save Updated Song" })).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Song Title"), {
      target: { value: "Updated Existing Song" },
    });
    fireEvent.change(screen.getByLabelText("BPM"), {
      target: { value: "96" },
    });
    fireEvent.change(screen.getByLabelText("Practice Goal"), {
      target: { value: "Updated practice goal." },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save Updated Song" }));

    expect(props.onUpdateSong).toHaveBeenCalledTimes(1);
    expect(props.onAddSong).not.toHaveBeenCalled();

    const updatedSong = props.onUpdateSong.mock.calls[0][0];

    expect(updatedSong.id).toBe("custom-existing-song");
    expect(updatedSong.title).toBe("Updated Existing Song");
    expect(updatedSong.bpm).toBe(96);
    expect(updatedSong.goal).toBe("Updated practice goal.");
    expect(updatedSong.createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(updatedSong.updatedAt).toBeTruthy();
    expect(updatedSong.isCustom).toBe(true);
    expect(updatedSong.strummingPattern.subdivision).toBe(EIGHTH_STRUMMING_SUBDIVISION);
  });

  it("canceling edit calls onCancelEdit and onClose", () => {
    const props = renderCustomSongForm({
      defaultOpen: true,
      editingSong: createEditingSong(),
      showToggle: false,
    });

    fireEvent.click(screen.getByRole("button", { name: "Cancel Edit" }));

    expect(props.onCancelEdit).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("resets new song fields without calling save handlers", () => {
    const props = renderCustomSongForm({
      defaultOpen: true,
      showToggle: false,
    });

    fireEvent.change(screen.getByLabelText("Song Title"), {
      target: { value: "Temporary Song" },
    });

    expect(screen.getByDisplayValue("Temporary Song")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Reset Form" }));

    expect(screen.queryByDisplayValue("Temporary Song")).toBeNull();
    expect(props.onAddSong).not.toHaveBeenCalled();
    expect(props.onUpdateSong).not.toHaveBeenCalled();
  });
});
