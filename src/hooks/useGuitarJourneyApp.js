import * as React from "react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_PROGRESS } from "../constants";
import { deleteRecording, saveRecording } from "../utils/recordingStorageUtils";
import { clearStoredProgress, loadStoredProgress, saveStoredProgress } from "../utils/storageUtils";
import usePracticeProgress from "./usePracticeProgress";
import useSessionRecorder from "./useSessionRecorder";
import useSessionTimer from "./useSessionTimer";
import useSongLibrary from "./useSongLibrary";

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

export default function useGuitarJourneyApp({ audioInputSettings } = {}) {
  const navigate = useNavigate();
  const storedProgress = useMemo(() => loadStoredProgress(), []);

  const [sessionMinutes, setSessionMinutes] = useState(storedProgress.sessionMinutes);
  const [sessionRating, setSessionRating] = useState("");
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

  const {
    discardRecording,
    hasPendingRecording,
    isSessionRecording,
    isSessionRecordingPaused,
    pendingRecording,
    pauseRecording,
    recordingDurationSeconds,
    recordingInputLevel,
    recordingMessage,
    resumeRecording,
    startRecording,
    stopRecording,
  } = useSessionRecorder({
    audioInputSettings,
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
    removeSessionRecording,
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

  const hasSelectedSessionRating = Boolean(sessionRating);
  const canSaveCompletedSession = canCompleteSession && hasSelectedSessionRating;

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
    setSessionRating("");
    void discardRecording();
  }, [discardRecording, selectedSong.id, sessionMinutes]);

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

  async function handleResetSessionTimer() {
    setSessionMessage("");
    setSessionRating("");
    await discardRecording();
    resetSessionTimer();
  }

  function handleSessionRatingChange(rating) {
    setSessionRating(rating);
    setSessionMessage("");
  }

  async function handleToggleSessionRecording() {
    setSessionMessage("");

    if (isSessionRecording) {
      await stopRecording();
      return;
    }

    if (!isSessionTimerRunning) {
      setSessionMessage("Start the session before recording practice audio.");
      return;
    }

    await startRecording();
  }

  async function handlePauseSessionRecording() {
    await pauseRecording();
  }

  async function handleResumeSessionRecording() {
    await resumeRecording();
  }

  async function getRecordingSessionFields(sessionId) {
    let recording = pendingRecording;

    if (isSessionRecording) {
      recording = await stopRecording();
    }

    if (!recording) return {};

    const recordingId = `recording-${sessionId}`;

    const savedRecording = await saveRecording(recordingId, recording.blob, {
      durationSeconds: recording.durationSeconds,
      mimeType: recording.mimeType,
      sessionId,
      songId: selectedSong.id,
      songTitle: selectedSong.title,
    });

    await discardRecording();

    return {
      recordingDurationSeconds: savedRecording.durationSeconds,
      recordingId: savedRecording.recordingId,
      recordingMimeType: savedRecording.mimeType,
    };
  }

  async function completeSession() {
    if (!canCompleteSession) {
      setSessionMessage("Start the session timer before saving practice history.");
      return;
    }

    if (!hasSelectedSessionRating) {
      setSessionMessage("Rate this session before saving practice history.");
      return;
    }

    const sessionId = createSessionId();
    let recordingFields = {};

    try {
      recordingFields = await getRecordingSessionFields(sessionId);
    } catch {
      setSessionMessage("The session recording could not be saved. Try saving again, or stop recording and retry.");
      return;
    }

    const session = {
      id: sessionId,
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
      ...recordingFields,
    };

    addSession(session);

    setIsSessionTimerRunning(false);
    setElapsedSessionSeconds(0);
    setSessionMessage(`Session saved: ${selectedSong.title} • ${actualPracticeMinutes} min actual • ${sessionRating}`);
    setSessionRating("");
  }

  async function handleDeleteSessionRecording(session) {
    const sessionId = String(session?.id || "").trim();
    const recordingId = String(session?.recordingId || "").trim();

    if (!sessionId || !recordingId) return false;

    await deleteRecording(recordingId);
    removeSessionRecording(sessionId);

    return true;
  }

  function resetLocalProgress() {
    clearStoredProgress();

    resetPracticeProgress();
    resetSongLibrary();

    setSessionMinutes(DEFAULT_PROGRESS.sessionMinutes);
    setSessionRating("");
    setSessionMessage("");
    setIsSessionTimerRunning(false);
    setElapsedSessionSeconds(0);
    void discardRecording();
    goToDashboard();
  }

  return {
    dashboardRouteProps: {
      actualPracticeMinutes,
      canCompleteSession: canSaveCompletedSession,
      completedSteps,
      elapsedSessionSeconds,
      filteredSongs,
      hasPendingRecording,
      isSessionRecording,
      isSessionRecordingPaused,
      isSessionTimerRunning,
      masteredSongs,
      onCompleteSession: completeSession,
      onDeleteCustomSong: handleDeleteCustomSong,
      onPauseSessionRecording: handlePauseSessionRecording,
      onResetSessionTimer: handleResetSessionTimer,
      onResumeSessionRecording: handleResumeSessionRecording,
      onSelectSong: handleSelectSong,
      onSessionMinutesChange: setSessionMinutes,
      onSessionRatingChange: handleSessionRatingChange,
      onStartEditCustomSong: handleStartEditCustomSong,
      onToggleMastered: handleToggleMasteredSong,
      onToggleSessionRecording: handleToggleSessionRecording,
      onToggleSessionTimer: handleToggleSessionTimer,
      onToggleStep: handleToggleStep,
      plan,
      progressPercent,
      recordingDurationSeconds,
      recordingInputLevel,
      recordingMessage,
      selectedSong,
      sessionHistory,
      sessionMessage,
      sessionMinutes,
      sessionRating,
    },
    editSongRouteProps: {
      customSongs,
      genres: pathOptions,
      onCancelEdit: handleCancelEditCustomSong,
      onClose: handleCloseCustomSongRoute,
      onUpdateSong: handleUpdateCustomSong,
    },
    historyRouteProps: {
      onDeleteSessionRecording: handleDeleteSessionRecording,
      sessions: sessionHistory,
    },
    newSongRouteProps: {
      genres: pathOptions,
      onAddSong: handleAddCustomSong,
      onCancelEdit: handleCancelEditCustomSong,
      onClose: handleCloseCustomSongRoute,
      onUpdateSong: handleUpdateCustomSong,
    },
    sidebarProps: {
      allSongs,
      builtInGenreNames,
      customGenres,
      masteredCount,
      onAddGenre: handleAddCustomGenre,
      onPathChange: handlePathChange,
      onRemoveGenre: handleRemoveCustomGenre,
      onResetLocalProgress: resetLocalProgress,
      onUpdateGenre: handleUpdateCustomGenre,
      pathCards,
      selectedPath,
      selectedSong,
      sessionHistory,
      totalPracticeMinutes,
      transitionScores,
    },
    songSectionsRouteProps: {
      selectedSong,
    },
    transitionsRouteProps: {
      selectedSong,
      transitionScores,
      onUpdateTransitionScore: handleUpdateTransitionScore,
    },
    weeklyPlanRouteProps: {
      masteredSongs,
      selectedSong,
      sessionHistory,
      sessionMinutes,
      transitionScores,
    },
  };
}
