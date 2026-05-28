function getTransitionScore(selectedSong, transitionScores, transition) {
  return Number(transitionScores[`${selectedSong.id}:${transition}`] || 0);
}

function getWeakTransitions(selectedSong, transitionScores) {
  if (!Array.isArray(selectedSong.transitions) || !selectedSong.transitions.length) {
    return [];
  }

  return [...selectedSong.transitions]
    .sort((a, b) => {
      return getTransitionScore(selectedSong, transitionScores, a) - getTransitionScore(selectedSong, transitionScores, b);
    })
    .slice(0, 3);
}

function getRecentSongSessions(selectedSong, sessionHistory) {
  if (!Array.isArray(sessionHistory)) return [];

  return sessionHistory.filter((session) => session.songId === selectedSong.id).slice(0, 5);
}

function getSectionByIndex(selectedSong, index) {
  if (!Array.isArray(selectedSong.sections) || !selectedSong.sections.length) {
    return {
      name: "Song section",
      progression: "Practice the main progression slowly.",
    };
  }

  return selectedSong.sections[index] || selectedSong.sections[0];
}

function getTransitionFocus(selectedSong, transitionScores) {
  const weakTransitions = getWeakTransitions(selectedSong, transitionScores);

  if (!weakTransitions.length) {
    return "Pick two chord changes from this song and loop them slowly.";
  }

  return `Focus on ${weakTransitions.join(" • ")}. Keep the changes clean before increasing speed.`;
}

function getMasteryMessage(selectedSong, masteredSongs) {
  if (masteredSongs[selectedSong.id]) {
    return "This song is already marked mastered. Use the week as a maintenance and polish cycle.";
  }

  return "Use the week to move from familiarity to a confident slow playthrough.";
}

export function createWeeklyPracticePlan({ masteredSongs, selectedSong, sessionHistory, sessionMinutes, transitionScores }) {
  const recentSessions = getRecentSongSessions(selectedSong, sessionHistory);
  const firstSection = getSectionByIndex(selectedSong, 0);
  const secondSection = getSectionByIndex(selectedSong, 1);
  const targetSlowBpm = Math.max(45, Math.round(Number(selectedSong.bpm || 80) * 0.75));
  const dailyMinutes = Number(sessionMinutes) || 20;

  return {
    focusTitle: selectedSong.title,
    focusSubtitle: getMasteryMessage(selectedSong, masteredSongs),
    recentSessionCount: recentSessions.length,
    totalRecentMinutes: recentSessions.reduce((sum, session) => sum + Number(session.minutes || 0), 0),
    days: [
      {
        day: "Day 1",
        title: "Chord foundation",
        minutes: dailyMinutes,
        detail: `Review each required chord: ${selectedSong.chords.join(", ")}. Listen for clean notes and relaxed hands.`,
      },
      {
        day: "Day 2",
        title: "Transition focus",
        minutes: dailyMinutes,
        detail: getTransitionFocus(selectedSong, transitionScores),
      },
      {
        day: "Day 3",
        title: "Rhythm and strumming",
        minutes: dailyMinutes,
        detail: `Mute the strings and loop the strumming pattern: ${selectedSong.strumming || "steady down/up rhythm"}. Then add chords slowly.`,
      },
      {
        day: "Day 4",
        title: firstSection.name,
        minutes: dailyMinutes,
        detail: `Practice this section in loops: ${firstSection.progression}. Stay below target tempo until it feels smooth.`,
      },
      {
        day: "Day 5",
        title: secondSection.name,
        minutes: dailyMinutes,
        detail: `Practice this section in loops: ${secondSection.progression}. Then connect it with ${firstSection.name}.`,
      },
      {
        day: "Day 6",
        title: "Slow full playthrough",
        minutes: dailyMinutes,
        detail: `Play the full song around ${targetSlowBpm} BPM. Do not stop for mistakes; recover and keep time.`,
      },
      {
        day: "Day 7",
        title: "Review and mastery check",
        minutes: dailyMinutes,
        detail: "Record or listen closely to one full pass. If the timing, changes, and sections feel steady, consider marking it mastered.",
      },
    ],
  };
}
