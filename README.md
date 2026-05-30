# Guitar Journey

Guitar Journey is a local-first guitar practice app for building real songs through chords, transitions, rhythm, timing, sections, and completed practice history.

The app is designed around a practical daily loop:

```txt
Choose a path → choose a song → learn the chords → drill transitions → practice rhythm → work sections → save the session
```

## Features

### Song practice

- Choose a genre path such as Worship, Blues, or Neo Soul.
- Select built-in songs or create custom songs.
- View the current song with style, level, tuning, key, capo, BPM, and strumming pattern.
- Mark songs as mastered with a star indicator.
- Delete custom songs with a confirmation dialog.

### Required chords

- View required chord diagrams for the selected song.
- Read chord-specific tips when available.
- Play synthesized chord samples directly from each required chord tile.

### Practice plan

- Follow a generated practice plan for the selected song.
- Adjust planned practice length.
- Track progress through warmup, transition drills, rhythm practice, song sections, and playthrough.
- Progress changes color based on completion:
  - Red at 0%
  - Blue from 1–99%
  - Green at 100%

### Practice session controls

- Start a session with a full-width session control.
- Pause and resume active sessions.
- Stop and reset the timer from the active control row.
- Rate a session after it starts.
- Save completed sessions only after the timer has started and a rating has been selected.

### Metronome and strumming

- Use a BPM-based metronome with an accented first beat.
- View a strumming playback guide while the metronome runs.
- Build structured strumming patterns with eighth-note and sixteenth-note slots.
- Use preset strumming patterns or create custom patterns.

### Song import and analysis

- Paste chord charts into the song analyzer.
- Detect metadata such as key, tuning, and capo when present.
- Parse sharps, flats, slash chords, bracketed sections, and repeated sections.
- Generate a suggested practice goal.
- Review analyzer confidence/fallback messaging before saving.

### Custom songs and genres

- Add and edit custom songs.
- Add, edit, and delete custom genres.
- Delete custom genres with a confirmation dialog when safe.
- Prevent deletion of custom genres that still contain songs.

### Practice history

- View saved sessions in Practice History.
- Track total practice time, this week’s practice time, current streak, longest streak, average rating, and recent sessions.
- Session history is stored locally on the user’s device.

### Settings

- Open app settings from the gear icon in the main navigation.
- Choose theme mode:
  - System
  - Dark
  - Light
- View placeholder sections for future Storage and Audio settings.

## Tech stack

- React
- Vite
- React Router
- Vitest
- Testing Library
- CSS modules by feature file
- Browser Web Audio API for metronome ticks and chord samples
- localStorage for current local-first progress/settings persistence

## Project structure

```txt
src/
  components/        Reusable UI components
  hooks/             App state and behavior hooks
  routes/            Route-level screens
  styles/            Feature-split CSS files
  utils/             Parsing, storage, chord, audio, and stats utilities
```

## Getting started

Install dependencies:

```bash
npm install
```

Start the local dev server:

```bash
npm run dev
```

Then open the local Vite URL shown in your terminal.

## Scripts

Run the development server:

```bash
npm run dev
```

Run tests:

```bash
npm run test -- --run
```

Build the production app:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Testing

The project currently includes tests for:

- Song import/analyzer utilities
- Structured strumming utilities
- Strumming playback hook
- Storage migration utilities
- Custom song form save/edit behavior
- Settings storage utilities
- Chord audio utilities
- Practice history stats utilities

Before pushing a branch, run:

```bash
npm run test -- --run
npm run build
```

## Persistence and privacy

Guitar Journey is currently local-first.

Progress, custom songs, custom genres, app settings, and session history are stored on the user’s current device through browser storage. This means:

- No account is required.
- Data is not synced across devices yet.
- Clearing browser storage can remove local progress.
- A future storage settings panel may support user-configured databases or cloud sync targets.

## Netlify deployment

This app can be deployed as a static Vite app on Netlify.

Recommended build settings:

```txt
Build command: npm run build
Publish directory: dist
```

This repository includes a `netlify.toml` configuration with the same build settings and a single-page app fallback so direct routes such as `/settings`, `/history`, and `/songs/new` load correctly.

## Current roadmap

Near-term:

- Add session recording with the browser microphone.
- Store audio recordings locally with IndexedDB.
- Show playback controls for recorded sessions in Practice History.
- Expand Settings → Audio for recording/input configuration.
- Expand Settings → Storage for future database or sync configuration.

Later:

- Improve chord audio with richer guitar-like voicings or sample playback.
- Add more song libraries and practice paths.
- Add deeper practice analytics.
- Add optional cloud sync.
- Add microphone-based chord recognition.
