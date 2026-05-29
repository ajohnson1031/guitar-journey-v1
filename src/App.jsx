import * as React from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AppSidebar, DashboardNav } from "./components";
import { DEFAULT_PROGRESS } from "./constants";
import { usePracticeProgress, useSessionTimer, useSongLibrary } from "./hooks";
import {
  DashboardRoute,
  EditSongRoute,
  HistoryRoute,
  NewSongRoute,
  SongSectionsRoute,
  TransitionsRoute,
  WeeklyPlanRoute,
} from "./routes";
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
  const navigate = useNavigate();
  const storedProgress = useMemo(() => loadStoredProgress(), []);

  const [sessionMinutes, setSessionMinutes] = useState(storedProgress.sessionMinutes);
  const [sessionRating, setSessionRating] = useState("Okay");
  const [sessionMessage, setSessionMessage] = useState("");

  const {
    addCustomGenre,
    addCustomSong,
    allSongs,
    builtInGenreNames,
    cancelEditCustomSong,
    customGenres,
    customSongs,
    deleteCustomSong,
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
  }, [
    selectedPath,
    selectedSongId,
    sessionMinutes,
    completedStepsBySong,
    masteredSongs,
    transitionScores,
    sessionHistory,
    customSongs,
    customGenres,
  ]);

  useEffect(() => {
    setSessionMessage("");
  }, [selectedSong.id, sessionMinutes]);

  function goToDashboard() {
    navigate("/");
  }

  function handlePathChange(pathName) {
    selectPath(pathName);
    setSessionMessage("");
    goToDashboard();
  }

  function handleSelectSong(songId) {
    selectSong(songId);
    setSessionMessage("");
  }

  function handleAddCustomSong(song) {
    addCustomSong(song);
    setSessionMessage("");
    goToDashboard();
  }

  function handleStartEditCustomSong(songId) {
    setSessionMessage("");
    navigate(`/songs/edit/${songId}`);
  }

  function handleCancelEditCustomSong() {
    cancelEditCustomSong();
    goToDashboard();
  }

  function handleCloseCustomSongRoute() {
    cancelEditCustomSong();
    goToDashboard();
  }

  function handleUpdateCustomSong(updatedSong) {
    updateCustomSong(updatedSong);
    setSessionMessage("");
    goToDashboard();
  }

  function handleDeleteCustomSong(songId) {
    const deletedSong = deleteCustomSong(songId);

    if (!deletedSong) return;

    removeSongProgress(songId);
    goToDashboard();
  }

  function handleAddCustomGenre(genre) {
    addCustomGenre(genre);
    goToDashboard();
  }

  function handleRemoveCustomGenre(genre) {
    removeCustomGenre(genre);
    goToDashboard();
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
    goToDashboard();
  }

  return (
    <main className="app-shell">
      <div className="app-grid">
        <AppSidebar
          allSongs={allSongs}
          builtInGenreNames={builtInGenreNames}
          customGenres={customGenres}
          masteredCount={masteredCount}
          onAddGenre={handleAddCustomGenre}
          onPathChange={handlePathChange}
          onRemoveGenre={handleRemoveCustomGenre}
          onResetLocalProgress={resetLocalProgress}
          onUpdateGenre={handleUpdateCustomGenre}
          pathCards={pathCards}
          selectedPath={selectedPath}
          selectedSong={selectedSong}
          sessionHistory={sessionHistory}
          totalPracticeMinutes={totalPracticeMinutes}
          transitionScores={transitionScores}
        />

        <section className="main-content">
          <DashboardNav />

          <Routes>
            <Route
              index
              element={
                <DashboardRoute
                  actualPracticeMinutes={actualPracticeMinutes}
                  canCompleteSession={canCompleteSession}
                  completedSteps={completedSteps}
                  elapsedSessionSeconds={elapsedSessionSeconds}
                  filteredSongs={filteredSongs}
                  isSessionTimerRunning={isSessionTimerRunning}
                  masteredSongs={masteredSongs}
                  onCompleteSession={completeSession}
                  onDeleteCustomSong={handleDeleteCustomSong}
                  onResetSessionTimer={handleResetSessionTimer}
                  onSelectSong={handleSelectSong}
                  onSessionMinutesChange={setSessionMinutes}
                  onSessionRatingChange={setSessionRating}
                  onStartEditCustomSong={handleStartEditCustomSong}
                  onToggleMastered={handleToggleMasteredSong}
                  onToggleSessionTimer={handleToggleSessionTimer}
                  onToggleStep={handleToggleStep}
                  plan={plan}
                  progressPercent={progressPercent}
                  selectedSong={selectedSong}
                  sessionMessage={sessionMessage}
                  sessionMinutes={sessionMinutes}
                  sessionRating={sessionRating}
                />
              }
            />

            <Route
              path="transitions"
              element={
                <TransitionsRoute
                  selectedSong={selectedSong}
                  transitionScores={transitionScores}
                  onUpdateTransitionScore={handleUpdateTransitionScore}
                />
              }
            />

            <Route path="sections" element={<SongSectionsRoute selectedSong={selectedSong} />} />

            <Route path="history" element={<HistoryRoute sessions={sessionHistory} />} />

            <Route
              path="weekly-plan"
              element={
                <WeeklyPlanRoute
                  masteredSongs={masteredSongs}
                  selectedSong={selectedSong}
                  sessionHistory={sessionHistory}
                  sessionMinutes={sessionMinutes}
                  transitionScores={transitionScores}
                />
              }
            />

            <Route
              path="songs/new"
              element={
                <NewSongRoute
                  genres={pathOptions}
                  onAddSong={handleAddCustomSong}
                  onCancelEdit={handleCancelEditCustomSong}
                  onClose={handleCloseCustomSongRoute}
                  onUpdateSong={handleUpdateCustomSong}
                />
              }
            />

            <Route
              path="songs/edit/:songId"
              element={
                <EditSongRoute
                  customSongs={customSongs}
                  genres={pathOptions}
                  onCancelEdit={handleCancelEditCustomSong}
                  onClose={handleCloseCustomSongRoute}
                  onUpdateSong={handleUpdateCustomSong}
                />
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </section>
      </div>
    </main>
  );
}
