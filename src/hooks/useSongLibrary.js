import * as React from "react";
import { DEFAULT_CUSTOM_GENRE_DESCRIPTION, DEFAULT_PROGRESS, PATHS, SONGS } from "../constants";
import { normalizeCustomGenre, normalizeCustomGenres } from "../utils/storageUtils";

const { useEffect, useMemo, useState } = React;

function normalizeGenreName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

export default function useSongLibrary({ initialProgress }) {
  const [selectedPath, setSelectedPath] = useState(initialProgress.selectedPath);
  const [selectedSongId, setSelectedSongId] = useState(initialProgress.selectedSongId);
  const [customSongs, setCustomSongs] = useState(initialProgress.customSongs);
  const [customGenres, setCustomGenres] = useState(() => normalizeCustomGenres(initialProgress.customGenres));
  const [editingSongId, setEditingSongId] = useState("");

  const allSongs = useMemo(() => [...SONGS, ...customSongs], [customSongs]);

  const builtInGenreNames = useMemo(() => PATHS.map((path) => path.name), []);

  const pathOptions = useMemo(() => {
    const customSongGenres = customSongs.map((song) => song.genre).filter(Boolean);
    const customGenreNames = customGenres.map((genre) => genre.name).filter(Boolean);

    return Array.from(new Set([...builtInGenreNames, ...customGenreNames, ...customSongGenres]));
  }, [builtInGenreNames, customGenres, customSongs]);

  const pathCards = useMemo(() => {
    const builtInCards = PATHS.map((path) => ({
      name: path.name,
      description: path.description,
      isCustom: false,
    }));

    const customCards = customGenres.map((genre) => ({
      name: genre.name,
      description: genre.description || DEFAULT_CUSTOM_GENRE_DESCRIPTION,
      isCustom: true,
    }));

    return [...builtInCards, ...customCards];
  }, [customGenres]);

  const filteredSongs = useMemo(() => allSongs.filter((song) => song.genre === selectedPath), [allSongs, selectedPath]);

  const selectedSong = useMemo(() => {
    const selectedSongInCurrentPath = filteredSongs.find((song) => song.id === selectedSongId);
    const selectedSongFromLibrary = allSongs.find((song) => song.id === selectedSongId);

    return selectedSongInCurrentPath || filteredSongs[0] || selectedSongFromLibrary || allSongs[0];
  }, [allSongs, filteredSongs, selectedSongId]);

  useEffect(() => {
    if (!allSongs.length) return;

    const selectedSongExists = allSongs.some((song) => song.id === selectedSongId);
    const selectedSongIsInCurrentPath = filteredSongs.some((song) => song.id === selectedSongId);

    if (filteredSongs.length && !selectedSongIsInCurrentPath) {
      setSelectedSongId(filteredSongs[0].id);
      return;
    }

    if (!selectedSongExists) {
      setSelectedSongId(filteredSongs[0]?.id || allSongs[0].id);
    }
  }, [allSongs, filteredSongs, selectedSongId]);

  const editingSong = useMemo(() => {
    if (!editingSongId) return null;

    return customSongs.find((song) => song.id === editingSongId) || null;
  }, [customSongs, editingSongId]);

  function selectPath(pathName) {
    const firstSong = allSongs.find((song) => song.genre === pathName);

    setSelectedPath(pathName);
    setSelectedSongId(firstSong?.id || selectedSongId);
  }

  function selectSong(songId) {
    setSelectedSongId(songId);
  }

  function addCustomSong(song) {
    setCustomSongs((current) => [song, ...current]);
    setSelectedPath(song.genre);
    setSelectedSongId(song.id);
    setEditingSongId("");
  }

  function startEditCustomSong(songId) {
    setEditingSongId(songId);
  }

  function cancelEditCustomSong() {
    setEditingSongId("");
  }

  function updateCustomSong(updatedSong) {
    setCustomSongs((current) => current.map((song) => (song.id === updatedSong.id ? updatedSong : song)));

    setSelectedPath(updatedSong.genre);
    setSelectedSongId(updatedSong.id);
    setEditingSongId("");
  }

  function deleteCustomSong(songId) {
    const songToDelete = customSongs.find((song) => song.id === songId);

    if (!songToDelete) return null;

    const nextCustomSongs = customSongs.filter((song) => song.id !== songId);
    const nextAllSongs = [...SONGS, ...nextCustomSongs];

    setCustomSongs(nextCustomSongs);

    if (selectedSongId === songId) {
      const fallbackSong = nextAllSongs.find((song) => song.genre === songToDelete.genre) || nextAllSongs[0];

      setSelectedPath(fallbackSong.genre);
      setSelectedSongId(fallbackSong.id);
    }

    if (editingSongId === songId) {
      setEditingSongId("");
    }

    return songToDelete;
  }

  function addCustomGenre(genre) {
    const nextGenre = normalizeCustomGenre(genre);

    if (!nextGenre.name) return;

    setCustomGenres((current) => {
      if (current.some((item) => item.name.toLowerCase() === nextGenre.name.toLowerCase())) {
        return current;
      }

      return [...current, nextGenre];
    });

    setSelectedPath(nextGenre.name);
  }

  function updateCustomGenre(updatedGenre) {
    const originalGenreName = normalizeGenreName(updatedGenre.originalName || updatedGenre.name);
    const nextGenre = normalizeCustomGenre(updatedGenre);

    if (!originalGenreName || !nextGenre.name) return;

    const originalGenreKey = originalGenreName.toLowerCase();

    setCustomGenres((current) =>
      current.map((genre) =>
        genre.name.toLowerCase() === originalGenreKey
          ? {
              ...genre,
              name: nextGenre.name,
              description: nextGenre.description,
            }
          : genre,
      ),
    );

    setCustomSongs((current) =>
      current.map((song) =>
        song.genre.toLowerCase() === originalGenreKey
          ? {
              ...song,
              genre: nextGenre.name,
            }
          : song,
      ),
    );

    if (selectedPath.toLowerCase() === originalGenreKey) {
      setSelectedPath(nextGenre.name);
    }
  }

  function removeCustomGenre(genreName) {
    setCustomGenres((current) => current.filter((item) => item.name !== genreName));

    if (selectedPath === genreName) {
      const fallbackSong = allSongs.find((song) => song.genre === DEFAULT_PROGRESS.selectedPath) || allSongs[0];

      setSelectedPath(fallbackSong.genre);
      setSelectedSongId(fallbackSong.id);
    }
  }

  function resetSongLibrary() {
    setSelectedPath(DEFAULT_PROGRESS.selectedPath);
    setSelectedSongId(DEFAULT_PROGRESS.selectedSongId);
    setCustomSongs([]);
    setCustomGenres([]);
    setEditingSongId("");
  }

  return {
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
  };
}
