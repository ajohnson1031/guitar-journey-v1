import { DEFAULT_CUSTOM_GENRE_DESCRIPTION, DEFAULT_PROGRESS, STORAGE_KEY, STORAGE_VERSION } from "../constants";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeSessionMinutes(value) {
  const minutes = Number(value);

  if (!Number.isFinite(minutes) || minutes <= 0) {
    return DEFAULT_PROGRESS.sessionMinutes;
  }

  return minutes;
}

export function normalizeCustomGenre(genre) {
  if (typeof genre === "string") {
    return {
      name: normalizeString(genre),
      description: DEFAULT_CUSTOM_GENRE_DESCRIPTION,
    };
  }

  return {
    name: normalizeString(genre?.name),
    description: normalizeString(genre?.description) || DEFAULT_CUSTOM_GENRE_DESCRIPTION,
  };
}

export function normalizeCustomGenres(customGenres) {
  if (!Array.isArray(customGenres)) return [];

  const seen = new Set();

  return customGenres.map(normalizeCustomGenre).filter((genre) => {
    if (!genre.name) return false;

    const key = genre.name.toLowerCase();

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function normalizeCustomSong(song) {
  if (!isPlainObject(song) || !song.id || !song.title) return null;

  return {
    ...song,
    artist: song.artist || "",
    instrument: song.instrument || "",
    tuning: song.tuning || "",
    capo: song.capo || "",
    source: song.source || "",
    sourceUrl: song.sourceUrl || "",
    isCustom: true,
  };
}

function normalizeCustomSongs(customSongs) {
  if (!Array.isArray(customSongs)) return [];

  return customSongs.map(normalizeCustomSong).filter(Boolean);
}

export function migrateStoredProgress(storedProgress) {
  const parsed = isPlainObject(storedProgress) ? storedProgress : {};

  return {
    ...DEFAULT_PROGRESS,
    ...parsed,
    storageVersion: STORAGE_VERSION,
    selectedPath: normalizeString(parsed.selectedPath) || DEFAULT_PROGRESS.selectedPath,
    selectedSongId: normalizeString(parsed.selectedSongId) || DEFAULT_PROGRESS.selectedSongId,
    sessionMinutes: normalizeSessionMinutes(parsed.sessionMinutes),
    completedStepsBySong: isPlainObject(parsed.completedStepsBySong) ? parsed.completedStepsBySong : {},
    masteredSongs: isPlainObject(parsed.masteredSongs) ? parsed.masteredSongs : {},
    transitionScores: isPlainObject(parsed.transitionScores) ? parsed.transitionScores : {},
    sessionHistory: Array.isArray(parsed.sessionHistory) ? parsed.sessionHistory : [],
    customSongs: normalizeCustomSongs(parsed.customSongs),
    customGenres: normalizeCustomGenres(parsed.customGenres),
  };
}

export function loadStoredProgress() {
  try {
    if (typeof window === "undefined") return DEFAULT_PROGRESS;

    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) return DEFAULT_PROGRESS;

    return migrateStoredProgress(JSON.parse(raw));
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function createStoredProgress(progress) {
  return migrateStoredProgress({
    storageVersion: STORAGE_VERSION,
    selectedPath: progress.selectedPath,
    selectedSongId: progress.selectedSongId,
    sessionMinutes: progress.sessionMinutes,
    completedStepsBySong: progress.completedStepsBySong,
    masteredSongs: progress.masteredSongs,
    transitionScores: progress.transitionScores,
    sessionHistory: progress.sessionHistory,
    customSongs: progress.customSongs,
    customGenres: progress.customGenres,
  });
}

export function saveStoredProgress(progress) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(createStoredProgress(progress)));
}

export function clearStoredProgress() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(STORAGE_KEY);
}
