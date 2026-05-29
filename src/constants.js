const STORAGE_KEY = "guitar-journey:v1:progress";

const STORAGE_VERSION = 3;

const DEFAULT_CUSTOM_GENRE_DESCRIPTION = "Custom genre for your personal practice library.";

const DEFAULT_PROGRESS = {
  storageVersion: STORAGE_VERSION,
  selectedPath: "Worship",
  selectedSongId: "good-good-father",
  sessionMinutes: 20,
  completedStepsBySong: {},
  masteredSongs: {},
  transitionScores: {},
  sessionHistory: [],
  customSongs: [],
  customGenres: [],
};

const SONGS = [
  {
    id: "good-good-father",
    title: "Good Good Father",
    genre: "Worship",
    key: "G",
    bpm: 72,
    difficulty: "Beginner",
    chords: ["G", "C", "Em", "D"],
    transitions: ["G → C", "C → G", "G → D", "Em → C"],
    sections: [
      { name: "Verse", progression: "G - C - G - D" },
      { name: "Chorus", progression: "G - D - Em - C" },
    ],
    strumming: "Down, down-up, up-down-up",
    goal: "Build clean open-chord movement and steady worship strumming.",
  },
  {
    id: "10000-reasons",
    title: "10,000 Reasons",
    genre: "Worship",
    key: "G",
    bpm: 74,
    difficulty: "Beginner",
    chords: ["G", "D", "Em", "C"],
    transitions: ["G → D", "D → Em", "Em → C", "C → G"],
    sections: [
      { name: "Verse", progression: "G - D - Em - C" },
      { name: "Chorus", progression: "C - G - D - Em" },
    ],
    strumming: "Down, down, down-up, down-up",
    goal: "Practice smooth four-chord worship progressions with consistent timing.",
  },
  {
    id: "amazing-grace",
    title: "Amazing Grace",
    genre: "Worship",
    key: "G",
    bpm: 68,
    difficulty: "Beginner",
    chords: ["G", "C", "D", "Em"],
    transitions: ["G → C", "C → G", "G → D", "D → G"],
    sections: [{ name: "Verse", progression: "G - C - G - D - G" }],
    strumming: "Slow 3/4 feel: down, down, down",
    goal: "Focus on clean chord tone, simple timing, and musical patience.",
  },
  {
    id: "twelve-bar-blues",
    title: "12-Bar Blues Groove",
    genre: "Blues",
    key: "E",
    bpm: 88,
    difficulty: "Beginner",
    chords: ["E7", "A7", "B7"],
    transitions: ["E7 → A7", "A7 → E7", "E7 → B7", "B7 → A7"],
    sections: [
      {
        name: "12-Bar Form",
        progression: "E7 - E7 - E7 - E7 / A7 - A7 - E7 - E7 / B7 - A7 - E7 - B7",
      },
    ],
    strumming: "Shuffle feel: long-short, long-short",
    goal: "Internalize the 12-bar form and dominant 7 chord movement.",
  },
  {
    id: "minor-pentatonic-jam",
    title: "Minor Pentatonic Jam",
    genre: "Blues",
    key: "A minor",
    bpm: 82,
    difficulty: "Beginner+",
    chords: ["Am", "Dm", "E7"],
    transitions: ["Am → Dm", "Dm → Am", "Am → E7", "E7 → Am"],
    sections: [{ name: "Loop", progression: "Am - Dm - Am - E7" }],
    strumming: "Slow blues pulse with light accents",
    goal: "Prepare the ear and hands for minor blues phrasing.",
  },
  {
    id: "major-seven-loop",
    title: "Major 7 Neo Soul Loop",
    genre: "Neo Soul",
    key: "C",
    bpm: 70,
    difficulty: "Intermediate",
    chords: ["Cmaj7", "Am7", "Dm7", "G7"],
    transitions: ["Cmaj7 → Am7", "Am7 → Dm7", "Dm7 → G7", "G7 → Cmaj7"],
    sections: [{ name: "Groove", progression: "Cmaj7 - Am7 - Dm7 - G7" }],
    strumming: "Muted groove: down, chuck, up, up-chuck",
    goal: "Introduce 7th chords, muting, and smoother voice-leading.",
  },
  {
    id: "minor-nine-color",
    title: "Minor 9 Color Practice",
    genre: "Neo Soul",
    key: "D minor",
    bpm: 64,
    difficulty: "Intermediate",
    chords: ["Dm9", "G13", "Cmaj7", "A7"],
    transitions: ["Dm9 → G13", "G13 → Cmaj7", "Cmaj7 → A7", "A7 → Dm9"],
    sections: [{ name: "ii-V-I Turnaround", progression: "Dm9 - G13 - Cmaj7 - A7" }],
    strumming: "Slow pocket groove with selective picking",
    goal: "Explore color chords and neo-soul style movement.",
  },
  {
    id: "open-chord-rock-anthem",
    title: "Open Chord Rock Anthem",
    genre: "Rock",
    key: "G",
    bpm: 96,
    difficulty: "Beginner",
    chords: ["G", "D", "Em", "C"],
    transitions: ["G → D", "D → Em", "Em → C", "C → G"],
    sections: [
      { name: "Verse", progression: "G - D - Em - C" },
      { name: "Chorus", progression: "C - G - D - Em" },
    ],
    strumming: "Down, down, down-up, down-up",
    goal: "Build confident open-chord rock strumming with steady timing and strong accents.",
  },
  {
    id: "power-chord-rock-groove",
    title: "Power Chord Rock Groove",
    genre: "Rock",
    key: "E",
    bpm: 110,
    difficulty: "Beginner+",
    chords: ["E5", "G5", "A5", "D5"],
    transitions: ["E5 → G5", "G5 → A5", "A5 → D5", "D5 → E5"],
    sections: [
      { name: "Main Riff", progression: "E5 - G5 - A5 - D5" },
      { name: "Chorus Push", progression: "A5 - G5 - E5 - D5" },
    ],
    strumming: "Steady eighth-note downstrokes with light palm muting",
    goal: "Develop power chord movement, downstroke control, and classic rock rhythm feel.",
  },
  {
    id: "minor-rock-drive",
    title: "Minor Rock Drive",
    genre: "Rock",
    key: "A minor",
    bpm: 104,
    difficulty: "Beginner+",
    chords: ["Am", "C", "G", "D"],
    transitions: ["Am → C", "C → G", "G → D", "D → Am"],
    sections: [
      { name: "Verse", progression: "Am - C - G - D" },
      { name: "Build", progression: "Am - G - D - C" },
    ],
    strumming: "Downstrokes on the beat, then add eighth-note drive",
    goal: "Practice minor-key rock movement with stronger rhythm and dynamic build.",
  },
];

const PATHS = [
  {
    name: "Worship",
    description: "Open chords, steady strumming, capo-friendly progressions, and song confidence.",
  },
  {
    name: "Blues",
    description: "12-bar form, dominant 7 chords, shuffle rhythm, and pentatonic foundation.",
  },
  {
    name: "Neo Soul",
    description: "7th chords, color voicings, groove, muting, embellishments, and smooth transitions.",
  },
  {
    name: "Rock",
    description: "Power chords, driving rhythm, palm muting, riffs, and strong downstroke timing.",
  },
];

const CHORD_DETAILS = {
  G: { level: "Beginner", tip: "Keep the wrist relaxed and let all strings ring clearly." },
  C: { level: "Beginner", tip: "Curve your fingers high so the open strings do not mute." },
  Em: { level: "Beginner", tip: "Use this as a reset chord: relaxed hand, clean pressure." },
  D: { level: "Beginner", tip: "Watch the high E string; it often gets muted by the ring finger." },
  E7: { level: "Beginner", tip: "Let the open strings give the chord its bluesy air." },
  A7: { level: "Beginner", tip: "Keep space between your two fingers so open strings ring." },
  B7: { level: "Beginner+", tip: "Move slowly; this shape rewards repetition." },
  Am: { level: "Beginner", tip: "Same shape family as E major, shifted strings." },
  Dm: { level: "Beginner+", tip: "Small shape, but precision matters on the top strings." },
  Cmaj7: { level: "Intermediate", tip: "Listen for the dreamy quality; avoid over-strumming." },
  Am7: { level: "Beginner+", tip: "Relaxed voicing that pairs beautifully with C major." },
  Dm7: { level: "Intermediate", tip: "Keep the barre light and avoid squeezing." },
  G7: { level: "Beginner", tip: "Listen for tension pulling back to C." },
  Dm9: { level: "Intermediate", tip: "Prioritize clean top notes over loud volume." },
  G13: { level: "Intermediate", tip: "Think color and movement, not brute force." },
  E5: {
    level: "Beginner+",
    tip: "Keep it tight and controlled. Mute the unused higher strings for a cleaner rock sound.",
  },
  G5: {
    level: "Beginner+",
    tip: "Move the whole power chord shape as one unit. Keep the wrist relaxed.",
  },
  A5: {
    level: "Beginner+",
    tip: "Focus on clean attack and palm muting. Avoid letting extra strings ring.",
  },
  D5: {
    level: "Beginner+",
    tip: "Let the open D string anchor the chord while keeping the top string muted.",
  },
  C5: {
    level: "Beginner+",
    tip: "Use the same movable power chord shape and keep the pressure even.",
  },
};

const CHORD_DIAGRAMS = {
  G: {
    frets: [3, 2, 0, 0, 3, 3],
    fingers: [2, 1, 0, 0, 3, 4],
  },
  C: {
    frets: [-1, 3, 2, 0, 1, 0],
    fingers: [0, 3, 2, 0, 1, 0],
  },
  Em: {
    frets: [0, 2, 2, 0, 0, 0],
    fingers: [0, 2, 3, 0, 0, 0],
  },
  D: {
    frets: [-1, -1, 0, 2, 3, 2],
    fingers: [0, 0, 0, 1, 3, 2],
  },
  E7: {
    frets: [0, 2, 0, 1, 0, 0],
    fingers: [0, 2, 0, 1, 0, 0],
  },
  A7: {
    frets: [-1, 0, 2, 0, 2, 0],
    fingers: [0, 0, 2, 0, 3, 0],
  },
  B7: {
    frets: [-1, 2, 1, 2, 0, 2],
    fingers: [0, 2, 1, 3, 0, 4],
  },
  Am: {
    frets: [-1, 0, 2, 2, 1, 0],
    fingers: [0, 0, 2, 3, 1, 0],
  },
  Dm: {
    frets: [-1, -1, 0, 2, 3, 1],
    fingers: [0, 0, 0, 2, 3, 1],
  },
  Cmaj7: {
    frets: [-1, 3, 2, 0, 0, 0],
    fingers: [0, 3, 2, 0, 0, 0],
  },
  Am7: {
    frets: [-1, 0, 2, 0, 1, 0],
    fingers: [0, 0, 2, 0, 1, 0],
  },
  Dm7: {
    frets: [-1, -1, 0, 2, 1, 1],
    fingers: [0, 0, 0, 2, 1, 1],
  },
  G7: {
    frets: [3, 2, 0, 0, 0, 1],
    fingers: [3, 2, 0, 0, 0, 1],
  },
  Dm9: {
    frets: [-1, 5, 3, 5, 5, 5],
    fingers: [0, 2, 1, 3, 3, 3],
    startFret: 3,
  },
  G13: {
    frets: [3, -1, 3, 4, 5, 5],
    fingers: [1, 0, 1, 2, 3, 4],
    startFret: 3,
  },
  E5: {
    frets: [0, 2, 2, -1, -1, -1],
    fingers: [0, 1, 3, 0, 0, 0],
  },
  G5: {
    frets: [3, 5, 5, -1, -1, -1],
    fingers: [1, 3, 4, 0, 0, 0],
    startFret: 3,
  },
  A5: {
    frets: [-1, 0, 2, 2, -1, -1],
    fingers: [0, 0, 1, 3, 0, 0],
  },
  D5: {
    frets: [-1, -1, 0, 2, 3, -1],
    fingers: [0, 0, 0, 1, 3, 0],
  },
  C5: {
    frets: [-1, 3, 5, 5, -1, -1],
    fingers: [0, 1, 3, 4, 0, 0],
    startFret: 3,
  },
};

const DEFAULT_CUSTOM_SONG_FORM = {
  sourceUrl: "",
  artist: "",
  instrument: "",
  title: "",
  genre: "",
  key: "",
  tuning: "",
  capo: "",
  bpm: "72",
  difficulty: "",
  chords: "G, C, Em, D",
  transitions: "",
  sections: "Verse: X - X - X - X\nChorus: X - X - X - X",
  strummingPattern: [],
  goal: "Build clean chord changes and steady timing.",
};

const SESSION_RATINGS = ["Easy", "Okay", "Hard"];

const NAV_SECTIONS = [
  {
    id: "dashboard",
    label: "Dashboard",
  },
  {
    id: "transitions",
    label: "Transition Tracker",
  },
  {
    id: "sections",
    label: "Song Sections",
  },
  {
    id: "history",
    label: "Practice History",
  },
  {
    id: "weekly-plan",
    label: "Weekly Plan",
  },
];

const DOWN_STRUM = "↓";
const UP_STRUM = "↑";

const KEY_OPTIONS = [
  "C",
  "C# / Db",
  "D",
  "D# / Eb",
  "E",
  "F",
  "F# / Gb",
  "G",
  "G# / Ab",
  "A",
  "A# / Bb",
  "B",
  "Cm",
  "C#m / Dbm",
  "Dm",
  "D#m / Ebm",
  "Em",
  "Fm",
  "F#m / Gbm",
  "Gm",
  "G#m / Abm",
  "Am",
  "A#m / Bbm",
  "Bm",
];

const DIFFICULTY_OPTIONS = ["Beginner", "Intermediate", "Advanced", "Expert"];

export {
  CHORD_DETAILS,
  CHORD_DIAGRAMS,
  DEFAULT_CUSTOM_GENRE_DESCRIPTION,
  DEFAULT_CUSTOM_SONG_FORM,
  DEFAULT_PROGRESS,
  DIFFICULTY_OPTIONS,
  DOWN_STRUM,
  KEY_OPTIONS,
  NAV_SECTIONS,
  PATHS,
  SESSION_RATINGS,
  SONGS,
  STORAGE_KEY,
  STORAGE_VERSION,
  UP_STRUM,
};
