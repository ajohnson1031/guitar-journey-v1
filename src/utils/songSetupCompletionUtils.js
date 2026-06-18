function hasRequiredSetupValue(value) {
  return Boolean(String(value || "").trim());
}

function createRequiredSetupItem({ isComplete, key, label, sectionId }) {
  return {
    isComplete: Boolean(isComplete),
    key,
    label,
    sectionId,
  };
}

function getRequiredSongSetupItems({
  chordCount = 0,
  difficulty = "",
  genre = "",
  hasRhythm = false,
  key = "",
  title = "",
} = {}) {
  return [
    createRequiredSetupItem({
      isComplete: hasRequiredSetupValue(title),
      key: "title",
      label: "Title",
      sectionId: "manual-song-details",
    }),
    createRequiredSetupItem({
      isComplete: hasRequiredSetupValue(genre),
      key: "genre",
      label: "Genre",
      sectionId: "manual-song-details",
    }),
    createRequiredSetupItem({
      isComplete: hasRequiredSetupValue(key),
      key: "key",
      label: "Key",
      sectionId: "manual-song-details",
    }),
    createRequiredSetupItem({
      isComplete: hasRequiredSetupValue(difficulty),
      key: "difficulty",
      label: "Difficulty",
      sectionId: "manual-song-details",
    }),
    createRequiredSetupItem({
      isComplete: Boolean(hasRhythm),
      key: "rhythm",
      label: "Rhythm",
      sectionId: "manual-rhythm",
    }),
    createRequiredSetupItem({
      isComplete: Number(chordCount) > 0,
      key: "chords",
      label: "Chords",
      sectionId: "manual-chords-sections",
    }),
  ];
}

function getRequiredSongSetupCompletion(items = []) {
  const total = items.length;
  const completed = items.filter((item) => item.isComplete).length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  return {
    completed,
    percent,
    total,
  };
}

export {
  getRequiredSongSetupCompletion,
  getRequiredSongSetupItems,
  hasRequiredSetupValue,
};
