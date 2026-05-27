import React, { useMemo, useState } from "react";
import "./App.css";

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
      { name: "Chorus", progression: "G - D - Em - C" }
    ],
    strumming: "Down, down-up, up-down-up",
    goal: "Build clean open-chord movement and steady worship strumming."
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
      { name: "Chorus", progression: "C - G - D - Em" }
    ],
    strumming: "Down, down, down-up, down-up",
    goal: "Practice smooth four-chord worship progressions with consistent timing."
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
    goal: "Focus on clean chord tone, simple timing, and musical patience."
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
        progression:
          "E7 - E7 - E7 - E7 / A7 - A7 - E7 - E7 / B7 - A7 - E7 - B7"
      }
    ],
    strumming: "Shuffle feel: long-short, long-short",
    goal: "Internalize the 12-bar form and dominant 7 chord movement."
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
    goal: "Prepare the ear and hands for minor blues phrasing."
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
    goal: "Introduce 7th chords, muting, and smoother voice-leading."
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
    goal: "Explore color chords and neo-soul style movement."
  }
];

const PATHS = [
  {
    name: "Worship",
    description: "Open chords, steady strumming, capo-friendly progressions, and song confidence."
  },
  {
    name: "Blues",
    description: "12-bar form, dominant 7 chords, shuffle rhythm, and pentatonic foundation."
  },
  {
    name: "Neo Soul",
    description: "7th chords, color voicings, groove, muting, embellishments, and smooth transitions."
  }
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
  G13: { level: "Intermediate", tip: "Think color and movement, not brute force." }
};

function createPracticePlan(song, minutes) {
  const warmup = Math.max(2, Math.round(minutes * 0.12));
  const transitions = Math.max(4, Math.round(minutes * 0.28));
  const rhythm = Math.max(4, Math.round(minutes * 0.22));
  const section = Math.max(5, Math.round(minutes * 0.28));
  const playthrough = Math.max(2, minutes - warmup - transitions - rhythm - section);

  return [
    {
      label: "Warm up",
      minutes: warmup,
      detail: `Play each chord slowly: ${song.chords.join(", ")}. Focus on clean tone.`
    },
    {
      label: "Transition drill",
      minutes: transitions,
      detail: `Loop these changes: ${song.transitions.slice(0, 3).join(" • ")}. Count clean changes.`
    },
    {
      label: "Rhythm practice",
      minutes: rhythm,
      detail: `Mute the strings and practice: ${song.strumming}. Keep the hand moving.`
    },
    {
      label: "Song section",
      minutes: section,
      detail: `Practice ${song.sections[0].name}: ${song.sections[0].progression}. Start below ${song.bpm} BPM.`
    },
    {
      label: "Playthrough",
      minutes: playthrough,
      detail: "Try one musical pass. Do not stop for mistakes; recover and keep time."
    }
  ];
}

export default function App() {
  const [selectedPath, setSelectedPath] = useState("Worship");
  const [selectedSongId, setSelectedSongId] = useState("good-good-father");
  const [sessionMinutes, setSessionMinutes] = useState(20);
  const [completedSteps, setCompletedSteps] = useState({});
  const [masteredSongs, setMasteredSongs] = useState({});
  const [transitionScores, setTransitionScores] = useState({});

  const filteredSongs = useMemo(
    () => SONGS.filter((song) => song.genre === selectedPath),
    [selectedPath]
  );

  const selectedSong = useMemo(() => {
    return SONGS.find((song) => song.id === selectedSongId) || filteredSongs[0] || SONGS[0];
  }, [selectedSongId, filteredSongs]);

  const plan = useMemo(
    () => createPracticePlan(selectedSong, sessionMinutes),
    [selectedSong, sessionMinutes]
  );

  const completedCount = plan.filter((step) => completedSteps[step.label]).length;
  const progressPercent = Math.round((completedCount / plan.length) * 100);

  function handlePathChange(pathName) {
    const firstSong = SONGS.find((song) => song.genre === pathName);
    setSelectedPath(pathName);
    setSelectedSongId(firstSong?.id || selectedSongId);
    setCompletedSteps({});
  }

  function toggleStep(label) {
    setCompletedSteps((current) => ({ ...current, [label]: !current[label] }));
  }

  function updateTransitionScore(transition, value) {
    setTransitionScores((current) => ({
      ...current,
      [`${selectedSong.id}:${transition}`]: value
    }));
  }

  return (
    <main className="app-shell">
      <div className="app-grid">
        <aside className="sidebar">
          <section className="hero-card">
            <p className="eyebrow">Guitar Journey</p>
            <h1>Practice with purpose.</h1>
            <p>
              Pick a style, choose a song, and get a focused session that connects chords,
              transitions, rhythm, and real song progress.
            </p>
          </section>

          <section className="panel-card">
            <h2>Genre Path</h2>
            <div className="path-list">
              {PATHS.map((path) => (
                <button
                  key={path.name}
                  type="button"
                  onClick={() => handlePathChange(path.name)}
                  className={`path-card ${selectedPath === path.name ? "is-active" : ""}`}
                >
                  <span>{path.name}</span>
                  <small>{path.description}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="panel-card">
            <h2>Practice Length</h2>
            <div className="button-row three">
              {[15, 20, 30].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setSessionMinutes(minutes)}
                  className={sessionMinutes === minutes ? "selected-button" : "ghost-button"}
                >
                  {minutes}m
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className="main-content">
          <div className="top-grid">
            <section className="song-card">
              <div className="song-header">
                <div>
                  <p className="eyebrow">Current Song</p>
                  <h2>{selectedSong.title}</h2>
                  <p>{selectedSong.goal}</p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setMasteredSongs((current) => ({
                      ...current,
                      [selectedSong.id]: !current[selectedSong.id]
                    }))
                  }
                  className={masteredSongs[selectedSong.id] ? "mastered-button" : "ghost-button"}
                >
                  {masteredSongs[selectedSong.id] ? "Marked Mastered" : "Mark Mastered"}
                </button>
              </div>

              <div className="info-grid">
                <InfoCard label="Key" value={selectedSong.key} />
                <InfoCard label="BPM" value={selectedSong.bpm} />
                <InfoCard label="Level" value={selectedSong.difficulty} />
                <InfoCard label="Style" value={selectedSong.genre} />
              </div>

              <label className="select-label" htmlFor="song-select">
                Choose Song
              </label>
              <select
                id="song-select"
                value={selectedSong.id}
                onChange={(event) => {
                  setSelectedSongId(event.target.value);
                  setCompletedSteps({});
                }}
              >
                {filteredSongs.map((song) => (
                  <option key={song.id} value={song.id}>
                    {song.title} — {song.difficulty}
                  </option>
                ))}
              </select>
            </section>

            <section className="session-card">
              <div className="session-header">
                <div>
                  <p className="eyebrow">Session</p>
                  <h2>Today’s Plan</h2>
                </div>
                <div className="progress-badge">{progressPercent}%</div>
              </div>

              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>

              <div className="step-list">
                {plan.map((step) => (
                  <button
                    key={step.label}
                    type="button"
                    onClick={() => toggleStep(step.label)}
                    className={`step-card ${completedSteps[step.label] ? "is-complete" : ""}`}
                  >
                    <span>
                      <strong>{step.label}</strong>
                      <small>{step.minutes} min</small>
                    </span>
                    <p>{step.detail}</p>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="bottom-grid">
            <section className="panel-card">
              <h2>Required Chords</h2>
              <p className="section-copy">Practice these before attempting the full song.</p>

              <div className="chord-grid">
                {selectedSong.chords.map((chord) => (
                  <div key={chord} className="chord-card">
                    <div>
                      <strong>{chord}</strong>
                      <span>{CHORD_DETAILS[chord]?.level || "Practice"}</span>
                    </div>
                    <p>{CHORD_DETAILS[chord]?.tip || "Play slowly and listen for clean ringing notes."}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel-card">
              <h2>Transition Tracker</h2>
              <p className="section-copy">Log clean changes per minute. Aim for smoothness before speed.</p>

              <div className="transition-list">
                {selectedSong.transitions.map((transition) => {
                  const key = `${selectedSong.id}:${transition}`;
                  return (
                    <div key={transition} className="transition-card">
                      <div>
                        <strong>{transition}</strong>
                        <span>{transitionScores[key] || 0} clean/min</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="80"
                        value={transitionScores[key] || 0}
                        onChange={(event) => updateTransitionScore(transition, Number(event.target.value))}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <section className="panel-card">
            <div className="section-heading-row">
              <div>
                <h2>Song Sections</h2>
                <p className="section-copy">Break the song into manageable pieces before the full playthrough.</p>
              </div>
              <span className="strum-pill">Strum: {selectedSong.strumming}</span>
            </div>

            <div className="section-list">
              {selectedSong.sections.map((section) => (
                <div key={section.name} className="song-section-card">
                  <span>{section.name}</span>
                  <strong>{section.progression}</strong>
                </div>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="info-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
