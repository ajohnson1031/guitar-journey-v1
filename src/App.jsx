import * as React from "react";
import { CHORD_DETAILS, DEFAULT_PROGRESS, PATHS, SONGS, STORAGE_KEY } from "./constants";

import "./App.css";

const { useEffect, useMemo, useState } = React;

function loadStoredProgress() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) return DEFAULT_PROGRESS;

    const parsed = JSON.parse(raw);

    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      completedStepsBySong: parsed.completedStepsBySong || {},
      masteredSongs: parsed.masteredSongs || {},
      transitionScores: parsed.transitionScores || {},
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

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
      detail: `Play each chord slowly: ${song.chords.join(", ")}. Focus on clean tone.`,
    },
    {
      label: "Transition drill",
      minutes: transitions,
      detail: `Loop these changes: ${song.transitions.slice(0, 3).join(" • ")}. Count clean changes.`,
    },
    {
      label: "Rhythm practice",
      minutes: rhythm,
      detail: `Mute the strings and practice: ${song.strumming}. Keep the hand moving.`,
    },
    {
      label: "Song section",
      minutes: section,
      detail: `Practice ${song.sections[0].name}: ${song.sections[0].progression}. Start below ${song.bpm} BPM.`,
    },
    {
      label: "Playthrough",
      minutes: playthrough,
      detail: "Try one musical pass. Do not stop for mistakes; recover and keep time.",
    },
  ];
}

export default function App() {
  const storedProgress = useMemo(() => loadStoredProgress(), []);

  const [selectedPath, setSelectedPath] = useState(storedProgress.selectedPath);
  const [selectedSongId, setSelectedSongId] = useState(storedProgress.selectedSongId);
  const [sessionMinutes, setSessionMinutes] = useState(storedProgress.sessionMinutes);
  const [completedStepsBySong, setCompletedStepsBySong] = useState(storedProgress.completedStepsBySong);
  const [masteredSongs, setMasteredSongs] = useState(storedProgress.masteredSongs);
  const [transitionScores, setTransitionScores] = useState(storedProgress.transitionScores);

  const filteredSongs = useMemo(() => SONGS.filter((song) => song.genre === selectedPath), [selectedPath]);

  const selectedSong = useMemo(() => {
    return SONGS.find((song) => song.id === selectedSongId) || filteredSongs[0] || SONGS[0];
  }, [selectedSongId, filteredSongs]);

  const completedSteps = completedStepsBySong[selectedSong.id] || {};

  const plan = useMemo(() => createPracticePlan(selectedSong, sessionMinutes), [selectedSong, sessionMinutes]);

  const completedCount = plan.filter((step) => completedSteps[step.label]).length;
  const progressPercent = Math.round((completedCount / plan.length) * 100);
  const masteredCount = Object.values(masteredSongs).filter(Boolean).length;

  useEffect(() => {
    const progress = {
      selectedPath,
      selectedSongId,
      sessionMinutes,
      completedStepsBySong,
      masteredSongs,
      transitionScores,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [selectedPath, selectedSongId, sessionMinutes, completedStepsBySong, masteredSongs, transitionScores]);

  function handlePathChange(pathName) {
    const firstSong = SONGS.find((song) => song.genre === pathName);

    setSelectedPath(pathName);
    setSelectedSongId(firstSong?.id || selectedSongId);
  }

  function toggleStep(label) {
    setCompletedStepsBySong((current) => {
      const currentSongSteps = current[selectedSong.id] || {};

      return {
        ...current,
        [selectedSong.id]: {
          ...currentSongSteps,
          [label]: !currentSongSteps[label],
        },
      };
    });
  }

  function updateTransitionScore(transition, value) {
    setTransitionScores((current) => ({
      ...current,
      [`${selectedSong.id}:${transition}`]: value,
    }));
  }

  function resetLocalProgress() {
    window.localStorage.removeItem(STORAGE_KEY);

    setSelectedPath(DEFAULT_PROGRESS.selectedPath);
    setSelectedSongId(DEFAULT_PROGRESS.selectedSongId);
    setSessionMinutes(DEFAULT_PROGRESS.sessionMinutes);
    setCompletedStepsBySong({});
    setMasteredSongs({});
    setTransitionScores({});
  }

  return (
    <main className="app-shell">
      <div className="app-grid">
        <aside className="sidebar">
          <section className="hero-card">
            <p className="eyebrow">Guitar Journey</p>
            <h1>Practice with purpose.</h1>
            <p>Pick a style, choose a song, and get a focused session that connects chords, transitions, rhythm, and real song progress.</p>
          </section>

          <section className="panel-card">
            <h2>Genre Path</h2>
            <div className="path-list">
              {PATHS.map((path) => (
                <button key={path.name} type="button" onClick={() => handlePathChange(path.name)} className={`path-card ${selectedPath === path.name ? "is-active" : ""}`}>
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
                <button key={minutes} type="button" onClick={() => setSessionMinutes(minutes)} className={sessionMinutes === minutes ? "selected-button" : "ghost-button"}>
                  {minutes}m
                </button>
              ))}
            </div>
          </section>

          <section className="panel-card local-progress-card">
            <h2>Local Progress</h2>
            <div className="progress-stat-grid">
              <div>
                <span>{masteredCount}</span>
                <small>songs mastered</small>
              </div>
              <div>
                <span>{Object.keys(transitionScores).length}</span>
                <small>tracked transitions</small>
              </div>
            </div>

            <button type="button" className="danger-button" onClick={resetLocalProgress}>
              Reset Local Progress
            </button>
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
                      [selectedSong.id]: !current[selectedSong.id],
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
              <select id="song-select" value={selectedSong.id} onChange={(event) => setSelectedSongId(event.target.value)}>
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
                  <button key={step.label} type="button" onClick={() => toggleStep(step.label)} className={`step-card ${completedSteps[step.label] ? "is-complete" : ""}`}>
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
                      <input type="range" min="0" max="80" value={transitionScores[key] || 0} onChange={(event) => updateTransitionScore(transition, Number(event.target.value))} />
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
