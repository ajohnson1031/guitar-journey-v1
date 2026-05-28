import * as React from "react";
import { DEFAULT_PROGRESS, PATHS, SONGS } from "../constants";

const { useMemo, useState } = React;

export default function useSongLibrary({ initialProgress }) {
  const [selectedPath, setSelectedPath] = useState(initialProgress.selectedPath);
  const [selectedSongId, setSelectedSongId] = useState(initialProgress.selectedSongId);
  const [customSongs, setCustomSongs] = useState(initialProgress.customSongs);
  const [customGenres, setCustomGenres] = useState(initialProgress.customGenres);
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
    setCustomGenres((current) => {
      if (current.some((item) => item.toLowerCase() === genre.toLowerCase())) {
        return current;
      }

      return [...current, genre];
    });

    setSelectedPath(genre);
  }

  function removeCustomGenre(genre) {
    setCustomGenres((current) => current.filter((item) => item !== genre));

    if (selectedPath === genre) {
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
    updateCustomSong,
  };
}
