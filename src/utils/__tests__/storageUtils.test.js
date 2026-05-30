import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_CUSTOM_GENRE_DESCRIPTION, DEFAULT_PROGRESS, DOWN_STRUM, STORAGE_KEY, STORAGE_VERSION, UP_STRUM } from "../../constants";
import {
  clearStoredProgress,
  createStoredProgress,
  loadStoredProgress,
  migrateStoredProgress,
  normalizeCustomGenre,
  normalizeCustomGenres,
  saveStoredProgress,
} from "../storageUtils";
import { EIGHTH_STRUMMING_SUBDIVISION, SIXTEENTH_STRUMMING_SUBDIVISION } from "../strummingUtils";

function createBaseProgress(overrides = {}) {
  return {
    ...DEFAULT_PROGRESS,
    selectedPath: "Blues",
    selectedSongId: "custom-test-song",
    sessionMinutes: 30,
    completedStepsBySong: {
      "custom-test-song": {
        "Warm up": true,
      },
    },
    masteredSongs: {
      "custom-test-song": true,
    },
    transitionScores: {
      "G → C": 12,
    },
    sessionHistory: [
      {
        id: "session-1",
        songId: "custom-test-song",
        songTitle: "Custom Test Song",
        minutes: 20,
      },
    ],
    customSongs: [],
    customGenres: [],
    ...overrides,
  };
}

describe("storageUtils", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns DEFAULT_PROGRESS when localStorage is empty", () => {
    expect(loadStoredProgress()).toEqual(DEFAULT_PROGRESS);
  });

  it("returns DEFAULT_PROGRESS when stored JSON is invalid", () => {
    window.localStorage.setItem(STORAGE_KEY, "{bad json");

    expect(loadStoredProgress()).toEqual(DEFAULT_PROGRESS);
  });

  it("migrates invalid stored shape safely", () => {
    const migrated = migrateStoredProgress(null);

    expect(migrated.storageVersion).toBe(STORAGE_VERSION);
    expect(migrated.selectedPath).toBe(DEFAULT_PROGRESS.selectedPath);
    expect(migrated.selectedSongId).toBe(DEFAULT_PROGRESS.selectedSongId);
    expect(migrated.sessionMinutes).toBe(DEFAULT_PROGRESS.sessionMinutes);
    expect(migrated.completedStepsBySong).toEqual({});
    expect(migrated.masteredSongs).toEqual({});
    expect(migrated.transitionScores).toEqual({});
    expect(migrated.sessionHistory).toEqual([]);
    expect(migrated.customSongs).toEqual([]);
    expect(migrated.customGenres).toEqual([]);
  });

  it("normalizes custom genre strings into genre objects", () => {
    expect(normalizeCustomGenre("Neo Soul")).toEqual({
      name: "Neo Soul",
      description: DEFAULT_CUSTOM_GENRE_DESCRIPTION,
    });
  });

  it("normalizes, trims, defaults, and dedupes custom genres", () => {
    const genres = normalizeCustomGenres([
      "Neo Soul",
      "neo soul",
      {
        name: "  Gospel  ",
        description: "  Church songs and worship progressions.  ",
      },
      {
        name: "Ambient",
        description: "",
      },
      {
        name: "",
        description: "Should be removed",
      },
    ]);

    expect(genres).toEqual([
      {
        name: "Neo Soul",
        description: DEFAULT_CUSTOM_GENRE_DESCRIPTION,
      },
      {
        name: "Gospel",
        description: "Church songs and worship progressions.",
      },
      {
        name: "Ambient",
        description: DEFAULT_CUSTOM_GENRE_DESCRIPTION,
      },
    ]);
  });

  it("migrates old custom songs with string strumming into v2 pattern data", () => {
    const migrated = migrateStoredProgress(
      createBaseProgress({
        storageVersion: 1,
        customSongs: [
          {
            id: "custom-string-strum",
            title: "String Strum Song",
            genre: "Worship",
            key: "G",
            bpm: 72,
            difficulty: "Beginner",
            chords: ["G", "C", "Em", "D"],
            transitions: ["G → C"],
            sections: [{ name: "Verse", progression: "G - C - Em - D" }],
            strumming: `${DOWN_STRUM} · ${DOWN_STRUM} ${UP_STRUM}`,
            goal: "Practice old string strumming.",
          },
        ],
      }),
    );

    const song = migrated.customSongs[0];

    expect(song.isCustom).toBe(true);
    expect(song.artist).toBe("");
    expect(song.instrument).toBe("");
    expect(song.tuning).toBe("");
    expect(song.capo).toBe("");
    expect(song.source).toBe("");
    expect(song.sourceUrl).toBe("");

    expect(song.strummingPattern.subdivision).toBe(EIGHTH_STRUMMING_SUBDIVISION);
    expect(song.strummingPattern.slots).toHaveLength(8);
    expect(song.strummingPattern.slots.map((slot) => slot.direction)).toEqual([DOWN_STRUM, "", DOWN_STRUM, UP_STRUM, "", "", "", ""]);
    expect(song.strumming).toBe(`${DOWN_STRUM} · ${DOWN_STRUM} ${UP_STRUM} · · · ·`);
  });

  it("migrates old custom songs with array strumming into v2 pattern data", () => {
    const migrated = migrateStoredProgress(
      createBaseProgress({
        customSongs: [
          {
            id: "custom-array-strum",
            title: "Array Strum Song",
            genre: "Blues",
            key: "E",
            bpm: 88,
            difficulty: "Beginner",
            chords: ["E7", "A7", "B7"],
            transitions: ["E7 → A7"],
            sections: [{ name: "Main", progression: "E7 - A7 - B7" }],
            strummingPattern: [DOWN_STRUM, "", DOWN_STRUM, UP_STRUM, UP_STRUM, DOWN_STRUM, DOWN_STRUM, UP_STRUM],
            strumming: "old fallback should be ignored because strummingPattern exists",
            goal: "Practice old array strumming.",
          },
        ],
      }),
    );

    const song = migrated.customSongs[0];

    expect(song.strummingPattern.subdivision).toBe(EIGHTH_STRUMMING_SUBDIVISION);
    expect(song.strummingPattern.slots).toHaveLength(8);
    expect(song.strummingPattern.slots.map((slot) => slot.direction)).toEqual([DOWN_STRUM, "", DOWN_STRUM, UP_STRUM, UP_STRUM, DOWN_STRUM, DOWN_STRUM, UP_STRUM]);
  });

  it("preserves v2 sixteenth-note custom song patterns", () => {
    const migrated = migrateStoredProgress(
      createBaseProgress({
        customSongs: [
          {
            id: "custom-sixteenth-strum",
            title: "Sixteenth Strum Song",
            genre: "Pop",
            key: "C",
            bpm: 100,
            difficulty: "Intermediate",
            chords: ["C", "G", "Am", "F"],
            transitions: ["C → G"],
            sections: [{ name: "Verse", progression: "C - G - Am - F" }],
            strummingPattern: {
              subdivision: SIXTEENTH_STRUMMING_SUBDIVISION,
              slots: [
                { slot: 0, direction: DOWN_STRUM },
                { slot: 2, direction: UP_STRUM },
                { slot: 8, direction: DOWN_STRUM },
                { slot: 14, direction: UP_STRUM },
              ],
            },
            goal: "Practice sixteenth strumming.",
          },
        ],
      }),
    );

    const song = migrated.customSongs[0];

    expect(song.strummingPattern.subdivision).toBe(SIXTEENTH_STRUMMING_SUBDIVISION);
    expect(song.strummingPattern.slots).toHaveLength(16);
    expect(song.strummingPattern.slots[0].direction).toBe(DOWN_STRUM);
    expect(song.strummingPattern.slots[2].direction).toBe(UP_STRUM);
    expect(song.strummingPattern.slots[8].direction).toBe(DOWN_STRUM);
    expect(song.strummingPattern.slots[14].direction).toBe(UP_STRUM);
  });

  it("filters invalid custom songs during migration", () => {
    const migrated = migrateStoredProgress(
      createBaseProgress({
        customSongs: [
          null,
          {},
          {
            id: "",
            title: "Missing ID",
          },
          {
            id: "missing-title",
            title: "",
          },
          {
            id: "valid-song",
            title: "Valid Song",
            genre: "Worship",
            key: "G",
            bpm: 72,
            difficulty: "Beginner",
            chords: ["G"],
            transitions: [],
            sections: [{ name: "Main", progression: "G" }],
            strumming: DOWN_STRUM,
            goal: "Valid song.",
          },
        ],
      }),
    );

    expect(migrated.customSongs).toHaveLength(1);
    expect(migrated.customSongs[0].id).toBe("valid-song");
  });

  it("normalizes invalid app-level fields during migration", () => {
    const migrated = migrateStoredProgress({
      selectedPath: "   ",
      selectedSongId: "",
      sessionMinutes: -10,
      completedStepsBySong: [],
      masteredSongs: null,
      transitionScores: "bad",
      sessionHistory: {},
      customSongs: "bad",
      customGenres: "bad",
    });

    expect(migrated.selectedPath).toBe(DEFAULT_PROGRESS.selectedPath);
    expect(migrated.selectedSongId).toBe(DEFAULT_PROGRESS.selectedSongId);
    expect(migrated.sessionMinutes).toBe(DEFAULT_PROGRESS.sessionMinutes);
    expect(migrated.completedStepsBySong).toEqual({});
    expect(migrated.masteredSongs).toEqual({});
    expect(migrated.transitionScores).toEqual({});
    expect(migrated.sessionHistory).toEqual([]);
    expect(migrated.customSongs).toEqual([]);
    expect(migrated.customGenres).toEqual([]);
  });

  it("creates stored progress in the migrated/current shape", () => {
    const storedProgress = createStoredProgress(
      createBaseProgress({
        customGenres: ["Neo Soul"],
        customSongs: [
          {
            id: "custom-create-stored",
            title: "Create Stored Song",
            genre: "Neo Soul",
            key: "Am",
            bpm: 82,
            difficulty: "Intermediate",
            chords: ["Am", "Dm", "E7"],
            transitions: ["Am → Dm"],
            sections: [{ name: "Main", progression: "Am - Dm - E7" }],
            strumming: `${DOWN_STRUM} ${UP_STRUM}`,
            goal: "Create stored progress.",
          },
        ],
      }),
    );

    expect(storedProgress.storageVersion).toBe(STORAGE_VERSION);
    expect(storedProgress.customGenres).toEqual([
      {
        name: "Neo Soul",
        description: DEFAULT_CUSTOM_GENRE_DESCRIPTION,
      },
    ]);
    expect(storedProgress.customSongs[0].strummingPattern.subdivision).toBe(EIGHTH_STRUMMING_SUBDIVISION);
    expect(storedProgress.customSongs[0].strummingPattern.slots).toHaveLength(8);
  });

  it("saveStoredProgress writes migrated progress to localStorage", () => {
    saveStoredProgress(
      createBaseProgress({
        customGenres: ["Neo Soul"],
        customSongs: [
          {
            id: "custom-saved",
            title: "Saved Song",
            genre: "Neo Soul",
            key: "C",
            bpm: 90,
            difficulty: "Beginner",
            chords: ["C", "F", "G"],
            transitions: ["C → F"],
            sections: [{ name: "Main", progression: "C - F - G" }],
            strumming: DOWN_STRUM,
            goal: "Saved song.",
          },
        ],
      }),
    );

    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw);

    expect(parsed.storageVersion).toBe(STORAGE_VERSION);
    expect(parsed.customGenres[0]).toEqual({
      name: "Neo Soul",
      description: DEFAULT_CUSTOM_GENRE_DESCRIPTION,
    });
    expect(parsed.customSongs[0].strummingPattern.subdivision).toBe(EIGHTH_STRUMMING_SUBDIVISION);
  });

  it("loadStoredProgress reads and migrates stored progress from localStorage", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        createBaseProgress({
          storageVersion: 1,
          selectedPath: "  Neo Soul  ",
          customGenres: ["Neo Soul"],
          customSongs: [
            {
              id: "custom-loaded",
              title: "Loaded Song",
              genre: "Neo Soul",
              key: "Am",
              bpm: 80,
              difficulty: "Intermediate",
              chords: ["Am", "Dm", "E7"],
              transitions: ["Am → Dm"],
              sections: [{ name: "Main", progression: "Am - Dm - E7" }],
              strumming: `${DOWN_STRUM} ${UP_STRUM}`,
              goal: "Loaded song.",
            },
          ],
        }),
      ),
    );

    const loaded = loadStoredProgress();

    expect(loaded.storageVersion).toBe(STORAGE_VERSION);
    expect(loaded.selectedPath).toBe("Neo Soul");
    expect(loaded.customGenres[0]).toEqual({
      name: "Neo Soul",
      description: DEFAULT_CUSTOM_GENRE_DESCRIPTION,
    });
    expect(loaded.customSongs[0].strummingPattern.subdivision).toBe(EIGHTH_STRUMMING_SUBDIVISION);
  });

  it("clearStoredProgress removes the stored progress key", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(createBaseProgress()));

    clearStoredProgress();

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
