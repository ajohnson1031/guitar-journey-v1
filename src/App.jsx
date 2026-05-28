import * as React from "react";
import { CurrentSongCard, CustomSongForm, GenreManager, Metronome, RequiredChords, SessionHistory, SongSections, TodayPlan, TransitionTracker, WeeklyPlan } from "./components";
import { DEFAULT_PROGRESS, NAV_SECTIONS } from "./constants";
import { usePracticeProgress, useSessionTimer, useSongLibrary } from "./hooks";
import { clearStoredProgress, loadStoredProgress, saveStoredProgress } from "./utils/storageUtils";

import "./App.css";

const { useEffect, useMemo, useState } = React;

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

export default function App() {
  const storedProgress = useMemo(() => loadStoredProgress(), []);

  const [sessionMinutes, setSessionMinutes] = useState(storedProgress.sessionMinutes);
  const [sessionRating, setSessionRating] = useState("Okay");
  const [sessionMessage, setSessionMessage] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");

  const {
    addCustomGenre,
    addCustomSong,
    allSongs,
    builtInGenreNames,
    cancelEditCustomSong,
    customGenres,
    customSongs,
    deleteCustomSong,
    editingSong,
    filteredSongs,
    pathCards,
    pathOptions,
    removeCustomGenre,
    resetSongLibrary,
    selectPath,
    selectSong,
    selectedPath,
    selectedSong,
    selectedSongId,
    startEditCustomSong,
    updateCustomGenre,
    updateCustomSong,
  } = useSongLibrary({
    initialProgress: storedProgress,
  });

  const {
    actualPracticeMinutes,
    canCompleteSession,
    elapsedSessionSeconds,
    isSessionTimerRunning,
    resetSessionTimer,
    setElapsedSessionSeconds,
    setIsSessionTimerRunning,
    toggleSessionTimer,
  } = useSessionTimer({
    resetKeys: [selectedSong.id, sessionMinutes],
  });

  const plan = useMemo(() => createPracticePlan(selectedSong, sessionMinutes), [selectedSong, sessionMinutes]);

  const {
    addSession,
    completedCount,
    completedSteps,
    completedStepsBySong,
    masteredCount,
    masteredSongs,
    progressPercent,
    removeSongProgress,
    resetPracticeProgress,
    sessionHistory,
    toggleMasteredSong,
    toggleStep: togglePracticeStep,
    totalPracticeMinutes,
    transitionScores,
    updateTransitionScore: updatePracticeTransitionScore,
  } = usePracticeProgress({
    initialProgress: storedProgress,
    selectedSong,
    plan,
  });

  useEffect(() => {
    saveStoredProgress({
      selectedPath,
      selectedSongId,
      sessionMinutes,
      completedStepsBySong,
      masteredSongs,
      transitionScores,
      sessionHistory,
      customSongs,
      customGenres,
    });
  }, [selectedPath, selectedSongId, sessionMinutes, completedStepsBySong, masteredSongs, transitionScores, sessionHistory, customSongs, customGenres]);

  useEffect(() => {
    setSessionMessage("");
  }, [selectedSong.id, sessionMinutes]);

  function handlePathChange(pathName) {
    selectPath(pathName);
    setSessionMessage("");
    setActiveSection("dashboard");
  }

  function handleSelectSong(songId) {
    selectSong(songId);
    setSessionMessage("");
  }

  function handleAddCustomSong(song) {
    addCustomSong(song);
    setSessionMessage("");
    setActiveSection("dashboard");
  }

  function handleStartEditCustomSong(songId) {
    startEditCustomSong(songId);
    setActiveSection("dashboard");
    setSessionMessage("");
  }

  function handleCancelEditCustomSong() {
    cancelEditCustomSong();
  }

  function handleUpdateCustomSong(updatedSong) {
    updateCustomSong(updatedSong);
    setSessionMessage("");
    setActiveSection("dashboard");
  }

  function handleDeleteCustomSong(songId) {
    const deletedSong = deleteCustomSong(songId);

    if (!deletedSong) return;

    removeSongProgress(songId);
    setActiveSection("dashboard");
  }

  function handleAddCustomGenre(genre) {
    addCustomGenre(genre);
    setActiveSection("dashboard");
  }

  function handleRemoveCustomGenre(genre) {
    removeCustomGenre(genre);
    setActiveSection("dashboard");
  }

  function handleUpdateCustomGenre(genre) {
    updateCustomGenre(genre);
  }

  function handleToggleStep(label) {
    togglePracticeStep(label);
    setSessionMessage("");
  }

  function handleUpdateTransitionScore(transition, value) {
    updatePracticeTransitionScore(transition, value);
  }

  function handleToggleMasteredSong(songId) {
    toggleMasteredSong(songId);
  }

  function handleToggleSessionTimer() {
    setSessionMessage("");
    toggleSessionTimer();
  }

  function handleResetSessionTimer() {
    setSessionMessage("");
    resetSessionTimer();
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

    addSession(session);

    setIsSessionTimerRunning(false);
    setElapsedSessionSeconds(0);
    setSessionMessage(`Session saved: ${selectedSong.title} • ${actualPracticeMinutes} min actual • ${sessionRating}`);
  }

  function resetLocalProgress() {
    clearStoredProgress();

    resetPracticeProgress();
    resetSongLibrary();

    setSessionMinutes(DEFAULT_PROGRESS.sessionMinutes);
    setSessionRating("Okay");
    setSessionMessage("");
    setIsSessionTimerRunning(false);
    setElapsedSessionSeconds(0);
    setActiveSection("dashboard");
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
            onUpdateGenre={handleUpdateCustomGenre}
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
                  onToggleMastered={handleToggleMasteredSong}
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
                onResetSessionTimer={handleResetSessionTimer}
                onSessionMinutesChange={setSessionMinutes}
                onSessionRatingChange={setSessionRating}
                onToggleSessionTimer={handleToggleSessionTimer}
                onToggleStep={handleToggleStep}
                plan={plan}
                progressPercent={progressPercent}
                sessionMessage={sessionMessage}
                sessionMinutes={sessionMinutes}
                sessionRating={sessionRating}
              />
            </div>
          ) : null}

          {activeSection === "transitions" ? (
            <TransitionTracker selectedSong={selectedSong} transitionScores={transitionScores} onUpdateTransitionScore={handleUpdateTransitionScore} />
          ) : null}

          {activeSection === "sections" ? <SongSections selectedSong={selectedSong} /> : null}

          {activeSection === "history" ? <SessionHistory sessions={sessionHistory} /> : null}

          {activeSection === "weekly-plan" ? (
            <WeeklyPlan
              masteredSongs={masteredSongs}
              selectedSong={selectedSong}
              sessionHistory={sessionHistory}
              sessionMinutes={sessionMinutes}
              transitionScores={transitionScores}
            />
          ) : null}
        </section>
      </div>
    </main>
  );
}
