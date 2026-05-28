import * as React from "react";
import { ChordDiagram, CustomSongForm, GenreManager, Metronome, SessionHistory } from "./components";
import { CHORD_DETAILS, CHORD_DIAGRAMS, DEFAULT_PROGRESS, NAV_SECTIONS, PATHS, SESSION_RATINGS, SONGS, STORAGE_KEY } from "./constants";

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
      sessionHistory: Array.isArray(parsed.sessionHistory) ? parsed.sessionHistory : [],
      customSongs: Array.isArray(parsed.customSongs) ? parsed.customSongs : [],
      customGenres: Array.isArray(parsed.customGenres) ? parsed.customGenres : [],
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

function createSessionId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `session-${Date.now()}`;
}

function formatElapsedTime(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function secondsToPracticeMinutes(totalSeconds) {
  if (!totalSeconds) return 0;

  return Math.max(1, Math.ceil(totalSeconds / 60));
}

function isArrowStrummingPattern(value) {
  return /^[↓↑\s]+$/.test(String(value || "").trim());
}

function StrummingPatternDisplay({ pattern }) {
  if (!isArrowStrummingPattern(pattern)) {
    return <span>{pattern}</span>;
  }

  return (
    <span className="inline-strumming-display" aria-label="Strumming pattern">
      {String(pattern)
        .trim()
        .split(/\s+/)
        .map((direction, index) => (
          <strong key={`${direction}-${index}`} className={direction === "↓" ? "strum-down" : "strum-up"}>
            {direction}
          </strong>
        ))}
    </span>
  );
}

export default function App() {
  const storedProgress = useMemo(() => loadStoredProgress(), []);

  const [selectedPath, setSelectedPath] = useState(storedProgress.selectedPath);
  const [selectedSongId, setSelectedSongId] = useState(storedProgress.selectedSongId);
  const [sessionMinutes, setSessionMinutes] = useState(storedProgress.sessionMinutes);
  const [completedStepsBySong, setCompletedStepsBySong] = useState(storedProgress.completedStepsBySong);
  const [masteredSongs, setMasteredSongs] = useState(storedProgress.masteredSongs);
  const [transitionScores, setTransitionScores] = useState(storedProgress.transitionScores);
  const [sessionHistory, setSessionHistory] = useState(storedProgress.sessionHistory);
  const [customSongs, setCustomSongs] = useState(storedProgress.customSongs);
  const [customGenres, setCustomGenres] = useState(storedProgress.customGenres);
  const [sessionRating, setSessionRating] = useState("Okay");
  const [sessionMessage, setSessionMessage] = useState("");
  const [isSessionTimerRunning, setIsSessionTimerRunning] = useState(false);
  const [elapsedSessionSeconds, setElapsedSessionSeconds] = useState(0);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [editingSongId, setEditingSongId] = useState("");

  const allSongs = useMemo(() => [...SONGS, ...customSongs], [customSongs]);

  const builtInGenreNames = useMemo(() => PATHS.map((path) => path.name), []);

  const pathOptions = useMemo(() => {
    const customSongGenres = customSongs.map((song) => song.genre).filter(Boolean);

    return Array.from(new Set([...builtInGenreNames, ...customGenres, ...customSongGenres]));
  }, [builtInGenreNames, customGenres, customSongs]);

  const pathCards = useMemo(() => {
    const builtInCards = PATHS.map((path) => ({
      name: path.name,
      description: path.description,
      isCustom: false,
    }));

    const customCards = customGenres.map((genre) => ({
      name: genre,
      description: "Custom genre for your personal practice library.",
      isCustom: true,
    }));

    return [...builtInCards, ...customCards];
  }, [customGenres]);

  const filteredSongs = useMemo(() => allSongs.filter((song) => song.genre === selectedPath), [allSongs, selectedPath]);

  const selectedSong = useMemo(() => {
    return allSongs.find((song) => song.id === selectedSongId) || filteredSongs[0] || allSongs[0];
  }, [allSongs, selectedSongId, filteredSongs]);

  const editingSong = useMemo(() => {
    if (!editingSongId) return null;

    return customSongs.find((song) => song.id === editingSongId) || null;
  }, [customSongs, editingSongId]);

  const completedSteps = completedStepsBySong[selectedSong.id] || {};

  const plan = useMemo(() => createPracticePlan(selectedSong, sessionMinutes), [selectedSong, sessionMinutes]);

  const completedCount = plan.filter((step) => completedSteps[step.label]).length;
  const progressPercent = Math.round((completedCount / plan.length) * 100);
  const masteredCount = Object.values(masteredSongs).filter(Boolean).length;
  const totalPracticeMinutes = sessionHistory.reduce((sum, session) => sum + session.minutes, 0);
  const actualPracticeMinutes = secondsToPracticeMinutes(elapsedSessionSeconds);
  const canCompleteSession = elapsedSessionSeconds > 0;

  useEffect(() => {
    const progress = {
      selectedPath,
      selectedSongId,
      sessionMinutes,
      completedStepsBySong,
      masteredSongs,
      transitionScores,
      sessionHistory,
      customSongs,
      customGenres,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [selectedPath, selectedSongId, sessionMinutes, completedStepsBySong, masteredSongs, transitionScores, sessionHistory, customSongs, customGenres]);

  useEffect(() => {
    if (!isSessionTimerRunning) return undefined;

    const intervalId = window.setInterval(() => {
      setElapsedSessionSeconds((currentSeconds) => currentSeconds + 1);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isSessionTimerRunning]);

  useEffect(() => {
    setIsSessionTimerRunning(false);
    setElapsedSessionSeconds(0);
    setSessionMessage("");
  }, [selectedSong.id, sessionMinutes]);

  function handlePathChange(pathName) {
    const firstSong = allSongs.find((song) => song.genre === pathName);

    setSelectedPath(pathName);
    setSelectedSongId(firstSong?.id || selectedSongId);
    setSessionMessage("");
    setActiveSection("dashboard");
  }

  function handleAddCustomSong(song) {
    setCustomSongs((current) => [song, ...current]);
    setSelectedPath(song.genre);
    setSelectedSongId(song.id);
    setEditingSongId("");
    setSessionMessage("");
    setActiveSection("dashboard");
  }

  function handleStartEditCustomSong(songId) {
    setEditingSongId(songId);
    setActiveSection("dashboard");
    setSessionMessage("");
  }

  function handleCancelEditCustomSong() {
    setEditingSongId("");
  }

  function handleUpdateCustomSong(updatedSong) {
    setCustomSongs((current) => current.map((song) => (song.id === updatedSong.id ? updatedSong : song)));

    setSelectedPath(updatedSong.genre);
    setSelectedSongId(updatedSong.id);
    setEditingSongId("");
    setSessionMessage("");
    setActiveSection("dashboard");
  }

  function handleDeleteCustomSong(songId) {
    const songToDelete = customSongs.find((song) => song.id === songId);

    if (!songToDelete) return;

    const nextCustomSongs = customSongs.filter((song) => song.id !== songId);
    const nextAllSongs = [...SONGS, ...nextCustomSongs];

    setCustomSongs(nextCustomSongs);

    setCompletedStepsBySong((current) => {
      const next = { ...current };
      delete next[songId];
      return next;
    });

    setMasteredSongs((current) => {
      const next = { ...current };
      delete next[songId];
      return next;
    });

    setTransitionScores((current) => {
      const next = {};

      for (const [key, value] of Object.entries(current)) {
        if (!key.startsWith(`${songId}:`)) {
          next[key] = value;
        }
      }

      return next;
    });

    if (selectedSongId === songId) {
      const fallbackSong = nextAllSongs.find((song) => song.genre === songToDelete.genre) || nextAllSongs[0];

      setSelectedPath(fallbackSong.genre);
      setSelectedSongId(fallbackSong.id);
    }

    if (editingSongId === songId) {
      setEditingSongId("");
    }

    setActiveSection("dashboard");
  }

  function handleAddCustomGenre(genre) {
    setCustomGenres((current) => {
      if (current.some((item) => item.toLowerCase() === genre.toLowerCase())) {
        return current;
      }

      return [...current, genre];
    });

    setSelectedPath(genre);
    setActiveSection("dashboard");
  }

  function handleRemoveCustomGenre(genre) {
    setCustomGenres((current) => current.filter((item) => item !== genre));

    if (selectedPath === genre) {
      const fallbackSong = allSongs.find((song) => song.genre === DEFAULT_PROGRESS.selectedPath) || allSongs[0];

      setSelectedPath(fallbackSong.genre);
      setSelectedSongId(fallbackSong.id);
    }

    setActiveSection("dashboard");
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

    setSessionMessage("");
  }

  function updateTransitionScore(transition, value) {
    setTransitionScores((current) => ({
      ...current,
      [`${selectedSong.id}:${transition}`]: value,
    }));
  }

  function toggleSessionTimer() {
    setSessionMessage("");
    setIsSessionTimerRunning((isRunning) => !isRunning);
  }

  function resetSessionTimer() {
    setIsSessionTimerRunning(false);
    setElapsedSessionSeconds(0);
    setSessionMessage("");
  }

  function completeSession() {
    if (!canCompleteSession) {
      setSessionMessage("Start the session timer before saving practice history.");
      return;
    }

    const session = {
      id: createSessionId(),
      songId: selectedSong.id,
      songTitle: selectedSong.title,
      genre: selectedSong.genre,
      plannedMinutes: sessionMinutes,
      minutes: actualPracticeMinutes,
      elapsedSeconds: elapsedSessionSeconds,
      rating: sessionRating,
      completedStepCount: completedCount,
      totalStepCount: plan.length,
      completedAt: new Date().toISOString(),
    };

    setSessionHistory((current) => [session, ...current].slice(0, 50));

    setCompletedStepsBySong((current) => ({
      ...current,
      [selectedSong.id]: {},
    }));

    setIsSessionTimerRunning(false);
    setElapsedSessionSeconds(0);
    setSessionMessage(`Session saved: ${selectedSong.title} • ${actualPracticeMinutes} min actual • ${sessionRating}`);
  }

  function resetLocalProgress() {
    window.localStorage.removeItem(STORAGE_KEY);

    setSelectedPath(DEFAULT_PROGRESS.selectedPath);
    setSelectedSongId(DEFAULT_PROGRESS.selectedSongId);
    setSessionMinutes(DEFAULT_PROGRESS.sessionMinutes);
    setCompletedStepsBySong({});
    setMasteredSongs({});
    setTransitionScores({});
    setSessionHistory([]);
    setCustomSongs([]);
    setSessionRating("Okay");
    setSessionMessage("");
    setIsSessionTimerRunning(false);
    setElapsedSessionSeconds(0);
    setActiveSection("dashboard");
    setEditingSongId("");
    setCustomGenres([]);
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
              {pathCards.map((path) => (
                <button key={path.name} type="button" onClick={() => handlePathChange(path.name)} className={`path-card ${selectedPath === path.name ? "is-active" : ""}`}>
                  <span>{path.name}</span>
                  <small>{path.description}</small>
                </button>
              ))}
            </div>
          </section>

          <GenreManager
            builtInGenres={builtInGenreNames}
            customGenres={customGenres}
            songs={allSongs}
            selectedPath={selectedPath}
            onAddGenre={handleAddCustomGenre}
            onRemoveGenre={handleRemoveCustomGenre}
          />

          <Metronome songTitle={selectedSong.title} songBpm={selectedSong.bpm} />

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
              <div>
                <span>{sessionHistory.length}</span>
                <small>sessions completed</small>
              </div>
              <div>
                <span>{totalPracticeMinutes}</span>
                <small>actual minutes</small>
              </div>
            </div>

            <button type="button" className="danger-button" onClick={resetLocalProgress}>
              Reset Local Progress
            </button>
          </section>
        </aside>

        <section className="main-content">
          <CustomSongForm
            editingSong={editingSong}
            genres={pathOptions}
            onAddSong={handleAddCustomSong}
            onCancelEdit={handleCancelEditCustomSong}
            onUpdateSong={handleUpdateCustomSong}
          />

          <nav className="dashboard-nav" aria-label="Guitar Journey sections">
            {NAV_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`dashboard-nav-button ${activeSection === section.id ? "is-active" : ""}`}
                onClick={() => setActiveSection(section.id)}
              >
                {section.label}
              </button>
            ))}
          </nav>

          {activeSection === "dashboard" ? (
            <div className="top-grid dashboard-top-grid">
              <div className="song-column">
                <section className="song-card compact-song-card">
                  <div className="song-header">
                    <div>
                      <p className="eyebrow">Current Song</p>
                      <h2>{selectedSong.title}</h2>
                      <p>{selectedSong.goal}</p>
                    </div>

                    <div className="song-header-actions song-icon-actions">
                      {selectedSong.isCustom ? (
                        <>
                          <button
                            type="button"
                            className="icon-button ghost-button edit-icon-button"
                            title="Edit Custom Song"
                            aria-label="Edit Custom Song"
                            onClick={() => handleStartEditCustomSong(selectedSong.id)}
                          >
                            <PencilIcon />
                          </button>

                          <button
                            type="button"
                            className="icon-button danger-button"
                            title="Delete Custom Song"
                            aria-label="Delete Custom Song"
                            onClick={() => handleDeleteCustomSong(selectedSong.id)}
                          >
                            <XIcon />
                          </button>
                        </>
                      ) : null}

                      <button
                        type="button"
                        title={masteredSongs[selectedSong.id] ? "Marked Mastered" : "Mark Mastered"}
                        aria-label={masteredSongs[selectedSong.id] ? "Marked Mastered" : "Mark Mastered"}
                        onClick={() =>
                          setMasteredSongs((current) => ({
                            ...current,
                            [selectedSong.id]: !current[selectedSong.id],
                          }))
                        }
                        className={`icon-button mastered-icon-button ${masteredSongs[selectedSong.id] ? "mastered-button" : "ghost-button"}`}
                      >
                        <DoubleCheckIcon />
                      </button>
                    </div>
                  </div>

                  <div className="info-grid compact-info-grid">
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
                      setSessionMessage("");
                    }}
                  >
                    {filteredSongs.map((song) => (
                      <option key={song.id} value={song.id}>
                        {song.title} — {song.difficulty}
                        {song.isCustom ? " — custom" : ""}
                      </option>
                    ))}
                  </select>
                </section>

                <section className="panel-card">
                  <h2>Required Chords</h2>
                  <p className="section-copy">Practice these before attempting the full song.</p>

                  <div className="chord-grid">
                    {selectedSong.chords.map((chord) => (
                      <div key={chord} className="chord-card">
                        <div className="chord-card-header">
                          <div>
                            <strong>{chord}</strong>
                            <span>{CHORD_DETAILS[chord]?.level || "Custom"}</span>
                          </div>
                        </div>

                        <ChordDiagram chordName={chord} diagram={CHORD_DIAGRAMS[chord]} />

                        <p>{CHORD_DETAILS[chord]?.tip || "No diagram/tip yet. Practice slowly and listen for clean ringing notes."}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <section className="session-card">
                <div className="session-header">
                  <div>
                    <p className="eyebrow">Session</p>
                    <h2>Today’s Plan</h2>
                  </div>
                  <div className="progress-badge">{progressPercent}%</div>
                </div>

                <div className="session-length-card">
                  <div>
                    <span>Practice Length</span>
                    <p>Adjust the session length to update each practice block.</p>
                  </div>

                  <div className="session-length-actions">
                    {[15, 20, 30].map((minutes) => (
                      <button key={minutes} type="button" onClick={() => setSessionMinutes(minutes)} className={sessionMinutes === minutes ? "selected-button" : "ghost-button"}>
                        {minutes}m
                      </button>
                    ))}
                  </div>
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

                <div className="complete-session-card">
                  <div>
                    <h3>Complete Session</h3>
                    <p>Start the timer, practice, rate how it felt, then save actual practice time.</p>
                  </div>

                  <div className="session-timer-display">
                    <span>Elapsed</span>
                    <strong>{formatElapsedTime(elapsedSessionSeconds)}</strong>
                    <small>
                      Planned: {sessionMinutes} min • Actual saved: {actualPracticeMinutes} min
                    </small>
                  </div>

                  <div className="session-timer-actions">
                    <button type="button" className={isSessionTimerRunning ? "metronome-stop-button" : "selected-button"} onClick={toggleSessionTimer}>
                      {isSessionTimerRunning ? "Pause Session" : "Start Session"}
                    </button>

                    <button type="button" className="ghost-button" onClick={resetSessionTimer}>
                      Reset Timer
                    </button>
                  </div>

                  <div className="rating-row" aria-label="Session rating">
                    {SESSION_RATINGS.map((rating) => (
                      <button key={rating} type="button" onClick={() => setSessionRating(rating)} className={sessionRating === rating ? "selected-button" : "ghost-button"}>
                        {rating}
                      </button>
                    ))}
                  </div>

                  <button type="button" className="complete-session-button" onClick={completeSession} disabled={!canCompleteSession}>
                    Save Completed Session
                  </button>

                  {sessionMessage ? <p className="session-message">{sessionMessage}</p> : null}
                </div>
              </section>
            </div>
          ) : null}

          {activeSection === "transitions" ? (
            <section className="panel-card detail-section-card">
              <div className="detail-section-header">
                <div>
                  <p className="eyebrow">Practice Detail</p>
                  <h2>Transition Tracker</h2>
                  <p className="section-copy">Log clean changes per minute. Aim for smoothness before speed.</p>
                </div>
              </div>

              <div className="transition-list transition-grid">
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
          ) : null}

          {activeSection === "sections" ? (
            <section className="panel-card detail-section-card">
              <div className="section-heading-row">
                <div>
                  <p className="eyebrow">Practice Detail</p>
                  <h2>Song Sections</h2>
                  <p className="section-copy">Break the song into manageable pieces before the full playthrough.</p>
                </div>
                <span className="strum-pill">
                  <span>Strum:</span>
                  <StrummingPatternDisplay pattern={selectedSong.strumming} />
                </span>
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
          ) : null}

          {activeSection === "history" ? <SessionHistory sessions={sessionHistory} /> : null}
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

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 20h4.25L19.7 8.55a2.12 2.12 0 0 0 0-3L18.45 4.3a2.12 2.12 0 0 0-3 0L4 15.75V20Z" />
      <path d="m14.5 5.25 4.25 4.25" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6 6 18 18" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

function DoubleCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m3.5 12.5 4 4L15 7.5" />
      <path d="m10.5 14.5 2 2L21 7.5" />
    </svg>
  );
}
