import * as React from "react";

const { useMemo, useState } = React;

export default function usePracticeProgress({ initialProgress, selectedSong, plan }) {
  const [completedStepsBySong, setCompletedStepsBySong] = useState(initialProgress.completedStepsBySong);
  const [masteredSongs, setMasteredSongs] = useState(initialProgress.masteredSongs);
  const [transitionScores, setTransitionScores] = useState(initialProgress.transitionScores);
  const [sessionHistory, setSessionHistory] = useState(initialProgress.sessionHistory);

  const completedSteps = completedStepsBySong[selectedSong.id] || {};

  const completedCount = useMemo(() => {
    return plan.filter((step) => completedSteps[step.label]).length;
  }, [completedSteps, plan]);

  const progressPercent = plan.length ? Math.round((completedCount / plan.length) * 100) : 0;

  const masteredCount = useMemo(() => {
    return Object.values(masteredSongs).filter(Boolean).length;
  }, [masteredSongs]);

  const totalPracticeMinutes = useMemo(() => {
    return sessionHistory.reduce((sum, session) => sum + session.minutes, 0);
  }, [sessionHistory]);

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

  function toggleMasteredSong(songId) {
    setMasteredSongs((current) => ({
      ...current,
      [songId]: !current[songId],
    }));
  }

  function addSession(session) {
    setSessionHistory((current) => [session, ...current].slice(0, 50));

    setCompletedStepsBySong((current) => ({
      ...current,
      [session.songId]: {},
    }));
  }

  function removeSongProgress(songId) {
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
  }

  function resetPracticeProgress() {
    setCompletedStepsBySong({});
    setMasteredSongs({});
    setTransitionScores({});
    setSessionHistory([]);
  }

  return {
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
    setSessionHistory,
    toggleMasteredSong,
    toggleStep,
    totalPracticeMinutes,
    transitionScores,
    updateTransitionScore,
  };
}
