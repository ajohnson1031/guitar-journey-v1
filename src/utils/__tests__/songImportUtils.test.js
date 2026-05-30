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
