# Guitar Journey 6D.3 — Apply Analysis Metadata

Full replacement files only.

## Apply

Copy the included `src/` files into the matching project paths.

## Changes

- Practice Setup Assistant analysis now detects metadata from pasted setup text:
  - Title
  - Artist
  - Instrument / Type
  - Genre
  - BPM / Tempo
  - Difficulty
  - Key
  - Tuning
  - Capo
- `Apply Analysis` now populates manual fields:
  - Song Title
  - Artist
  - Instrument / Type
  - Genre, only when it matches an existing genre case-insensitively
  - BPM, clamped to 40–220
  - existing applied fields remain: Chords, Transitions, Sections, Difficulty, Key, Tuning, Capo, Practice Goal
- Analysis message now includes how many metadata details were detected.
- Preserves the smaller info button sizing:
  - 20px button
  - 15px glyph
- Keeps the info dialog, copy/use sample icon buttons, trash clear button, and disabled button behavior.

## Sample expected input

```txt
Title: Greensleeves
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

Refrain:
G - D - Bm - Em
C - B7 - Em - Em
```

## Run

```bash
npm run test:run -- CustomSongForm
npm run build
npm run dev
```


## 6D.3b Fix

- Restores metadata parsing for compact pasted lines like:
  `Tuning: E A D G B EKey: BmCapo: No capo`
- Keeps new metadata detection for Title, Artist, Instrument / Type, Genre, BPM / Tempo, Difficulty, Key, Tuning, and Capo.
