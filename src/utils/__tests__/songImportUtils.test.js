import { describe, expect, it } from "vitest";
import { analyzeSongText, estimateSongKeyDetails, extractChordsFromSongText, extractSectionsFromSongText } from "../songImportUtils";

const HOTEL_STYLE_CHART = `
Tuning: E A D G B EKey: BmCapo: No capo

[Intro]
Bm F# A E
G D Em F#7

[Verse 1]
Bm F# A E
G D Em F#7

[Chorus]
G D F#7 Bm
G D Em F#7

[Verse 2]
Bm F# A E
G D Em F#7

[Chorus]
G D F#7 Bm
G D Em F#7

[Guitar Solo]
Bm F# A E
G D Em F#7

[Outro]
Bm F# A E
G D Em F#7
`;

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

describe("songImportUtils", () => {
  it("analyzes a Hotel California-style chart without losing sharps", () => {
    const analysis = analyzeSongText(HOTEL_STYLE_CHART);

    expect(analysis.key).toBe("Bm");
    expect(analysis.keySource).toBe("metadata");
    expect(analysis.keyConfidence).toBe("high");
    expect(analysis.tuning).toBe("Standard");
    expect(analysis.capo).toBe("No capo");

    expect(analysis.chords).toEqual(["Bm", "F#", "A", "E", "G", "D", "Em", "F#7"]);
    expect(analysis.chords).not.toContain("F");

    expect(analysis.transitions).toContain("Bm → F#");
    expect(analysis.transitions).toContain("Em → F#7");
  });

  it("dedupes repeated Verse and Chorus sections but preserves Intro, Solo, and Outro", () => {
    const sections = extractSectionsFromSongText(HOTEL_STYLE_CHART);

    expect(sections).toEqual([
      {
        name: "Intro",
        progression: "Bm - F# - A - E - G - D - Em - F#7",
      },
      {
        name: "Verse",
        progression: "Bm - F# - A - E - G - D - Em - F#7",
      },
      {
        name: "Chorus",
        progression: "G - D - F#7 - Bm - Em",
      },
      {
        name: "Guitar Solo",
        progression: "Bm - F# - A - E - G - D - Em - F#7",
      },
      {
        name: "Outro",
        progression: "Bm - F# - A - E - G - D - Em - F#7",
      },
    ]);
  });

  it("preserves sharps, flats, minors, and slash chords", () => {
    const text = `
[Verse]
Bb Eb F# C#m
D/F# C/E G/B
`;

    expect(extractChordsFromSongText(text)).toEqual(["Bb", "Eb", "F#", "C#m", "D/F#", "C/E", "G/B"]);
  });

  it("does not treat ordinary lyric lines as chord lines", () => {
    const text = `
A simple lyric line should not become a chord.
No capo today should not become a chord.
I saw a bright light in the distance.
`;

    expect(extractChordsFromSongText(text)).toEqual([]);
  });

  it("estimates B minor from a strong F#7 to Bm resolution", () => {
    const result = estimateSongKeyDetails(["Bm", "F#", "A", "E", "G", "D", "Em", "F#7", "Bm"]);

    expect(result.key).toBe("Bm");
    expect(["medium", "high"]).toContain(result.confidence);
  });

  it("detects Practice Setup Assistant metadata from pasted song details", () => {
    const analysis = analyzeSongText(GREENSLEEVES_SETUP);

    expect(analysis.title).toBe("Greensleeves");
    expect(analysis.artist).toBe("Traditional");
    expect(analysis.instrument).toBe("Chords");
    expect(analysis.genre).toBe("Folk");
    expect(analysis.bpm).toBe(86);
    expect(analysis.difficulty).toBe("Intermediate");
    expect(analysis.difficultyConfidence).toBe("high");
    expect(analysis.key).toBe("Em");
    expect(analysis.keySource).toBe("metadata");
    expect(analysis.keyConfidence).toBe("high");
    expect(analysis.tuning).toBe("Standard");
    expect(analysis.capo).toBe("No capo");
  });

  it("extracts chords, transitions, and multiple sections from Practice Setup Assistant text", () => {
    const analysis = analyzeSongText(GREENSLEEVES_SETUP);

    expect(analysis.chords).toEqual(["Em", "G", "D", "Bm", "C", "Am", "B7"]);
    expect(analysis.transitions).toContain("Em → G");
    expect(analysis.transitions).toContain("Am → B7");
    expect(analysis.transitions).toContain("B7 → Em");
    expect(analysis.sections).toEqual([
      {
        name: "Main",
        progression: "Em - G - D - Bm - C - Am - B7",
      },
      {
        name: "Verse",
        progression: "Em - G - D - Bm - C - Am - B7",
      },
      {
        name: "Refrain",
        progression: "G - D - Bm - Em - C - Am - B7",
      },
    ]);
    expect(analysis.goal).toContain("Learn Greensleeves");
    expect(analysis.goal).toContain("verse progression");
  });

  it("supports compact pasted metadata and clamps BPM values", () => {
    const highBpmAnalysis = analyzeSongText(`Title: Compact SongArtist: Test PlayerInstrument / Type: ChordsGenre: BluesBPM: 320Key: GCapo: No capoTuning: E A D G B E
G C D G`);
    const lowBpmAnalysis = analyzeSongText(`Title: Slow SongTempo: 12Key: C
C F G C`);

    expect(highBpmAnalysis.title).toBe("Compact Song");
    expect(highBpmAnalysis.artist).toBe("Test Player");
    expect(highBpmAnalysis.instrument).toBe("Chords");
    expect(highBpmAnalysis.genre).toBe("Blues");
    expect(highBpmAnalysis.bpm).toBe(220);
    expect(highBpmAnalysis.key).toBe("G");
    expect(highBpmAnalysis.tuning).toBe("Standard");
    expect(highBpmAnalysis.capo).toBe("No capo");

    expect(lowBpmAnalysis.bpm).toBe(40);
  });

  it("generates fallback review data from analyzed text", () => {
    const analysis = analyzeSongText(`
[Verse]
G D Em C

[Chorus]
C G D Em
`);

    expect(analysis.chords).toEqual(["G", "D", "Em", "C"]);
    expect(analysis.sections).toEqual([
      {
        name: "Verse",
        progression: "G - D - Em - C",
      },
      {
        name: "Chorus",
        progression: "C - G - D - Em",
      },
    ]);
    expect(analysis.difficulty).toBe("Beginner");
    expect(analysis.difficultyConfidence).toBe("medium");
    expect(analysis.goal).toContain("Learn the song");
    expect(analysis.goal).toContain("transition");
  });
});
