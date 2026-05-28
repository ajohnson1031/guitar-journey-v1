import * as React from "react";
import { CurrentSongCard, CustomSongForm, GenreManager, Metronome, RequiredChords, SessionHistory, SongSections, TodayPlan, TransitionTracker } from "./components";
import { DEFAULT_PROGRESS, NAV_SECTIONS, PATHS, SONGS, STORAGE_KEY } from "./constants";

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

function secondsToPracticeMinutes(totalSeconds) {
  if (!totalSeconds) return 0;

  return Math.max(1, Math.ceil(totalSeconds / 60));
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

  function handleSelectSong(songId) {
    setSelectedSongId(songId);
    setSessionMessage("");
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

  function toggleMasteredSong(songId) {
    setMasteredSongs((current) => ({
      ...current,
      [songId]: !current[songId],
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
                <CurrentSongCard
                  filteredSongs={filteredSongs}
                  masteredSongs={masteredSongs}
                  onDeleteCustomSong={handleDeleteCustomSong}
                  onSelectSong={handleSelectSong}
                  onStartEditCustomSong={handleStartEditCustomSong}
                  onToggleMastered={toggleMasteredSong}
                  selectedSong={selectedSong}
                />

                <RequiredChords selectedSong={selectedSong} />
              </div>

              <TodayPlan
                actualPracticeMinutes={actualPracticeMinutes}
                canCompleteSession={canCompleteSession}
                completedSteps={completedSteps}
                elapsedSessionSeconds={elapsedSessionSeconds}
                isSessionTimerRunning={isSessionTimerRunning}
                onCompleteSession={completeSession}
                onResetSessionTimer={resetSessionTimer}
                onSessionMinutesChange={setSessionMinutes}
                onSessionRatingChange={setSessionRating}
                onToggleSessionTimer={toggleSessionTimer}
                onToggleStep={toggleStep}
                plan={plan}
                progressPercent={progressPercent}
                sessionMessage={sessionMessage}
                sessionMinutes={sessionMinutes}
                sessionRating={sessionRating}
              />
            </div>
          ) : null}

          {activeSection === "transitions" ? (
            <TransitionTracker selectedSong={selectedSong} transitionScores={transitionScores} onUpdateTransitionScore={updateTransitionScore} />
          ) : null}

          {activeSection === "sections" ? <SongSections selectedSong={selectedSong} /> : null}

          {activeSection === "history" ? <SessionHistory sessions={sessionHistory} /> : null}
        </section>
      </div>
    </main>
  );
}
